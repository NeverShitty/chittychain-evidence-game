#!/usr/bin/env node

/**
 * ChittyChain Game Server
 * Express server that bridges the gamified UI with ChittyChain MCP backend
 * Handles XP tracking, achievements, and real blockchain operations
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

// Initialize Express app
const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Game state storage (in production, use a database)
let gameState = {
  players: new Map(),
  chainStats: {
    height: 0,
    totalArtifacts: 0,
    isValid: true,
    pendingArtifacts: 0
  },
  leaderboard: [],
  dailyQuests: [
    { id: 'mint_3', task: 'Mint 3 pieces of evidence', reward: 150, progress: 0, maxProgress: 3 },
    { id: 'verify_5', task: 'Verify 5 pieces of evidence', reward: 100, progress: 0, maxProgress: 5 },
    { id: 'audit_chain', task: 'Complete blockchain audit', reward: 200, progress: 0, maxProgress: 1 }
  ]
};

// XP calculation system
const XP_REWARDS = {
  mint_evidence: 25,
  verify_evidence: 15,
  mine_block: 50,
  audit_chain: 100,
  first_mint: 100,
  streak_bonus: 10,
  high_value_evidence: 50,
  perfect_verification: 75,
  chain_validation: 150,
  daily_quest: 25
};

// Achievement definitions
const ACHIEVEMENTS = [
  {
    id: 'first_mint',
    name: 'First Evidence',
    description: 'Mint your first piece of evidence',
    icon: '🥇',
    xp: 100,
    condition: (player) => player.totalMints >= 1
  },
  {
    id: 'high_roller',
    name: 'High Roller',
    description: 'Mint evidence worth over $100,000',
    icon: '💎',
    xp: 200,
    condition: (player) => player.highestEvidenceValue >= 100000
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 7-day minting streak',
    icon: '🔥',
    xp: 300,
    condition: (player) => player.currentStreak >= 7
  },
  {
    id: 'chain_guardian',
    name: 'Chain Guardian',
    description: 'Successfully validate the entire blockchain',
    icon: '🛡️',
    xp: 500,
    condition: (player) => player.totalAudits >= 1
  },
  {
    id: 'evidence_master',
    name: 'Evidence Master',
    description: 'Mint 100 pieces of evidence',
    icon: '👑',
    xp: 1000,
    condition: (player) => player.totalMints >= 100
  },
  {
    id: 'verification_expert',
    name: 'Verification Expert',
    description: 'Verify 50 pieces of evidence',
    icon: '🔍',
    xp: 750,
    condition: (player) => player.totalVerifications >= 50
  },
  {
    id: 'daily_champion',
    name: 'Daily Champion',
    description: 'Complete all daily quests',
    icon: '⭐',
    xp: 500,
    condition: (player) => player.dailyQuestsCompleted >= 3
  }
];

// ChittyChain CLI wrapper
class ChittyChainCLI {
  constructor() {
    this.cliPath = '/Users/nickbianchi/MAIN/gh/ChittyChain/chittychain-cli.js';
  }

  async executeCommand(command, args = []) {
    try {
      const fullCommand = `node "${this.cliPath}" ${command} ${args.join(' ')}`;
      const { stdout, stderr } = await execAsync(fullCommand, { 
        timeout: 30000,
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      if (stderr && !stderr.includes('ChittyChain MCP Server')) {
        console.warn('ChittyChain CLI warning:', stderr);
      }
      
      return { success: true, output: stdout, error: null };
    } catch (error) {
      console.error('ChittyChain CLI error:', error);
      return { success: false, output: null, error: error.message };
    }
  }

  async mintEvidence(artifacts, minerEmail = 'game@chittychain.local') {
    try {
      // Create temporary file with artifacts
      const tempFile = path.join(__dirname, `temp_artifacts_${Date.now()}.json`);
      await fs.writeFile(tempFile, JSON.stringify(artifacts, null, 2));

      const result = await this.executeCommand('verified-mint', [
        '--file', tempFile,
        '--level', 'legal',
        '--no-consent'
      ]);

      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {}); // Ignore cleanup errors

      if (result.success) {
        // Parse the output to extract block information
        const output = result.output;
        const blockMatch = output.match(/Block Hash: ([a-fA-F0-9]+)/);
        const indexMatch = output.match(/Block Index: (\d+)/);
        const timeMatch = output.match(/Mining Time: (\d+)ms/);

        return {
          success: true,
          block: {
            hash: blockMatch ? blockMatch[1] : 'unknown',
            index: indexMatch ? parseInt(indexMatch[1]) : 0,
            timestamp: new Date().toISOString(),
            miningTime: timeMatch ? parseInt(timeMatch[1]) : 0,
            artifactCount: artifacts.length
          },
          minted: artifacts.length,
          rejected: 0
        };
      } else {
        return {
          success: false,
          error: result.error || 'Minting failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyEvidence(artifacts) {
    try {
      const tempFile = path.join(__dirname, `temp_verify_${Date.now()}.json`);
      await fs.writeFile(tempFile, JSON.stringify(artifacts, null, 2));

      const result = await this.executeCommand('verify-only', [
        '--file', tempFile,
        '--level', 'legal',
        '--snapshot'
      ]);

      await fs.unlink(tempFile).catch(() => {});

      if (result.success) {
        // Parse verification results
        const output = result.output;
        const trustScoreMatch = output.match(/Average Trust Score: ([0-9.]+)/);
        const recommendedMatch = output.match(/Recommended for Minting: (YES|NO)/);

        return {
          success: true,
          report: {
            averageTrustScore: trustScoreMatch ? parseFloat(trustScoreMatch[1]) : 0.85,
            recommendedForMinting: recommendedMatch ? recommendedMatch[1] === 'YES' : true,
            artifacts: artifacts.map(a => ({
              id: a.id,
              trustScore: 0.85 + Math.random() * 0.15, // Simulated for demo
              status: 'passed',
              issues: [],
              warnings: []
            }))
          }
        };
      } else {
        return {
          success: false,
          error: result.error || 'Verification failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getChainStatus() {
    try {
      const result = await this.executeCommand('status');
      
      if (result.success) {
        // Parse status output
        const output = result.output;
        const heightMatch = output.match(/Chain Height\s+(\d+)/);
        const artifactsMatch = output.match(/Total Artifacts\s+(\d+)/);
        const validMatch = output.match(/Chain Valid\s+(.)/);

        return {
          height: heightMatch ? parseInt(heightMatch[1]) : 0,
          totalArtifacts: artifactsMatch ? parseInt(artifactsMatch[1]) : 0,
          isValid: validMatch ? validMatch[1] === '✓' : true,
          pendingArtifacts: 0 // TODO: Parse from output
        };
      } else {
        return {
          height: 0,
          totalArtifacts: 0,
          isValid: false,
          pendingArtifacts: 0
        };
      }
    } catch (error) {
      console.error('Status check error:', error);
      return {
        height: 0,
        totalArtifacts: 0,
        isValid: false,
        pendingArtifacts: 0
      };
    }
  }

  async analyzePerformance() {
    try {
      const result = await this.executeCommand('analyze');
      
      if (result.success) {
        // Parse analysis output for XP rewards
        const output = result.output;
        const blocksMatch = output.match(/Total Blocks: (\d+)/);
        const artifactsMatch = output.match(/Total Artifacts: (\d+)/);
        const avgTimeMatch = output.match(/Avg Block Time: ([0-9.]+)s/);

        return {
          success: true,
          statistics: {
            totalBlocks: blocksMatch ? parseInt(blocksMatch[1]) : 0,
            totalArtifacts: artifactsMatch ? parseInt(artifactsMatch[1]) : 0,
            avgBlockTime: avgTimeMatch ? parseFloat(avgTimeMatch[1]) * 1000 : 5000
          }
        };
      } else {
        return {
          success: false,
          error: result.error || 'Analysis failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Initialize ChittyChain CLI
const chittyChain = new ChittyChainCLI();

// Player management
function getPlayer(playerId) {
  if (!gameState.players.has(playerId)) {
    gameState.players.set(playerId, {
      id: playerId,
      xp: 0,
      level: 1,
      totalMints: 0,
      totalVerifications: 0,
      totalAudits: 0,
      currentStreak: 0,
      highestEvidenceValue: 0,
      dailyQuestsCompleted: 0,
      achievements: new Set(),
      lastActive: new Date().toISOString(),
      joinedAt: new Date().toISOString()
    });
  }
  return gameState.players.get(playerId);
}

function calculateLevel(xp) {
  return Math.floor(xp / 200) + 1;
}

function checkAchievements(player) {
  const newAchievements = [];
  
  for (const achievement of ACHIEVEMENTS) {
    if (!player.achievements.has(achievement.id) && achievement.condition(player)) {
      player.achievements.add(achievement.id);
      player.xp += achievement.xp;
      newAchievements.push({
        ...achievement,
        unlocked: true,
        unlockedAt: new Date().toISOString()
      });
    }
  }
  
  return newAchievements;
}

function updateDailyQuests(action, playerId) {
  const questUpdates = [];
  
  gameState.dailyQuests.forEach(quest => {
    if (quest.progress < quest.maxProgress) {
      let increment = 0;
      
      switch (quest.id) {
        case 'mint_3':
          if (action === 'mint') increment = 1;
          break;
        case 'verify_5':
          if (action === 'verify') increment = 1;
          break;
        case 'audit_chain':
          if (action === 'audit') increment = 1;
          break;
      }
      
      if (increment > 0) {
        quest.progress = Math.min(quest.progress + increment, quest.maxProgress);
        questUpdates.push(quest);
        
        // Award XP if quest completed
        if (quest.progress === quest.maxProgress) {
          const player = getPlayer(playerId);
          player.xp += quest.reward;
          player.dailyQuestsCompleted += 1;
          
          questUpdates.push({
            type: 'quest_completed',
            quest: quest,
            xpAwarded: quest.reward
          });
        }
      }
    }
  });
  
  return questUpdates;
}

// API Endpoints

// Get player profile
app.get('/api/player/:id', (req, res) => {
  const player = getPlayer(req.params.id);
  const achievements = ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: player.achievements.has(a.id)
  }));
  
  res.json({
    ...player,
    achievements,
    level: calculateLevel(player.xp)
  });
});

// Get chain status
app.get('/api/chain/status', async (req, res) => {
  try {
    const status = await chittyChain.getChainStatus();
    gameState.chainStats = status;
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = Array.from(gameState.players.values())
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10)
    .map(player => ({
      id: player.id,
      xp: player.xp,
      level: calculateLevel(player.xp),
      totalMints: player.totalMints,
      achievements: player.achievements.size
    }));
  
  res.json(leaderboard);
});

// Get daily quests
app.get('/api/quests/daily', (req, res) => {
  res.json(gameState.dailyQuests);
});

// Mint evidence
app.post('/api/evidence/mint', async (req, res) => {
  try {
    const { playerId, artifacts } = req.body;
    const player = getPlayer(playerId);
    
    // Mint to blockchain
    const result = await chittyChain.mintEvidence(artifacts);
    
    if (result.success) {
      // Update player stats
      player.totalMints += artifacts.length;
      player.currentStreak += 1;
      player.lastActive = new Date().toISOString();
      
      // Calculate XP rewards
      let totalXP = XP_REWARDS.mint_evidence * artifacts.length;
      
      // Check for high-value evidence bonus
      for (const artifact of artifacts) {
        if (artifact.amount) {
          const value = parseFloat(artifact.amount.replace(/[$,]/g, ''));
          if (value > player.highestEvidenceValue) {
            player.highestEvidenceValue = value;
          }
          if (value > 50000) {
            totalXP += XP_REWARDS.high_value_evidence;
          }
        }
      }
      
      // First mint bonus
      if (player.totalMints === artifacts.length) {
        totalXP += XP_REWARDS.first_mint;
      }
      
      player.xp += totalXP;
      player.level = calculateLevel(player.xp);
      
      // Check achievements
      const newAchievements = checkAchievements(player);
      
      // Update daily quests
      const questUpdates = updateDailyQuests('mint', playerId);
      
      // Broadcast updates
      io.emit('player_updated', { 
        playerId, 
        player,
        xpGained: totalXP,
        newAchievements,
        questUpdates
      });
      
      res.json({
        success: true,
        result,
        xpGained: totalXP,
        newAchievements,
        questUpdates,
        player: {
          xp: player.xp,
          level: player.level,
          totalMints: player.totalMints
        }
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify evidence
app.post('/api/evidence/verify', async (req, res) => {
  try {
    const { playerId, artifacts } = req.body;
    const player = getPlayer(playerId);
    
    const result = await chittyChain.verifyEvidence(artifacts);
    
    if (result.success) {
      player.totalVerifications += artifacts.length;
      player.lastActive = new Date().toISOString();
      
      const xpGained = XP_REWARDS.verify_evidence * artifacts.length;
      player.xp += xpGained;
      player.level = calculateLevel(player.xp);
      
      const newAchievements = checkAchievements(player);
      const questUpdates = updateDailyQuests('verify', playerId);
      
      io.emit('player_updated', { 
        playerId, 
        player,
        xpGained,
        newAchievements,
        questUpdates
      });
      
      res.json({
        success: true,
        result,
        xpGained,
        newAchievements,
        questUpdates
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Audit chain
app.post('/api/chain/audit', async (req, res) => {
  try {
    const { playerId } = req.body;
    const player = getPlayer(playerId);
    
    const result = await chittyChain.analyzePerformance();
    
    if (result.success) {
      player.totalAudits += 1;
      player.lastActive = new Date().toISOString();
      
      const xpGained = XP_REWARDS.audit_chain;
      player.xp += xpGained;
      player.level = calculateLevel(player.xp);
      
      const newAchievements = checkAchievements(player);
      const questUpdates = updateDailyQuests('audit', playerId);
      
      io.emit('player_updated', { 
        playerId, 
        player,
        xpGained,
        newAchievements,
        questUpdates
      });
      
      res.json({
        success: true,
        result,
        xpGained,
        newAchievements,
        questUpdates
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  socket.on('join_game', (playerId) => {
    const player = getPlayer(playerId);
    socket.join(playerId);
    socket.emit('game_state', {
      player,
      chainStatus: gameState.chainStats,
      dailyQuests: gameState.dailyQuests
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
  });
});

// Periodic chain status updates
setInterval(async () => {
  try {
    const status = await chittyChain.getChainStatus();
    if (JSON.stringify(status) !== JSON.stringify(gameState.chainStats)) {
      gameState.chainStats = status;
      io.emit('chain_status_updated', status);
    }
  } catch (error) {
    console.error('Chain status update error:', error);
  }
}, 10000); // Update every 10 seconds

// Daily quest reset (at midnight)
function resetDailyQuests() {
  gameState.dailyQuests = [
    { id: 'mint_3', task: 'Mint 3 pieces of evidence', reward: 150, progress: 0, maxProgress: 3 },
    { id: 'verify_5', task: 'Verify 5 pieces of evidence', reward: 100, progress: 0, maxProgress: 5 },
    { id: 'audit_chain', task: 'Complete blockchain audit', reward: 200, progress: 0, maxProgress: 1 }
  ];
  
  // Reset daily quest completion for all players
  for (const player of gameState.players.values()) {
    player.dailyQuestsCompleted = 0;
  }
  
  io.emit('daily_quests_reset', gameState.dailyQuests);
}

// Schedule daily reset at midnight
const now = new Date();
const midnight = new Date(now);
midnight.setHours(24, 0, 0, 0);
const msUntilMidnight = midnight.getTime() - now.getTime();
setTimeout(() => {
  resetDailyQuests();
  setInterval(resetDailyQuests, 24 * 60 * 60 * 1000); // Every 24 hours
}, msUntilMidnight);

// Start server
const PORT = process.env.PORT || 3101;
server.listen(PORT, () => {
  console.log(`🎮 ChittyChain Game Server running on port ${PORT}`);
  console.log(`🔗 Connected to ChittyChain CLI at: ${chittyChain.cliPath}`);
  console.log(`📊 Real-time updates via WebSocket`);
  console.log(`🏆 XP system and achievements active`);
});

export { app, server, io };