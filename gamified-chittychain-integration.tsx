/**
 * Gamified ChittyChain Integration
 * Connects the beautiful gamified UI to actual ChittyChain blockchain backend
 * Real evidence minting with XP rewards and achievement tracking
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Database, PackageIcon, ShieldCheck, Clock, Trophy, Zap, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types for ChittyChain integration
interface ChittyChainMintResult {
  success: boolean;
  block?: {
    index: number;
    hash: string;
    timestamp: string;
    artifactCount: number;
  };
  minted?: number;
  rejected?: number;
  error?: string;
}

interface EvidenceArtifact {
  id: string;
  contentHash: string;
  statement: string;
  weight: number;
  tier: 'GOVERNMENT' | 'ATTORNEY_CLIENT' | 'FINANCIAL_INSTITUTION' | 'EXECUTIVE' | 'SYSTEM';
  type: string;
  caseId?: string;
  metadata?: Record<string, any>;
  amount?: string;
  reference?: string;
}

interface GameMetrics {
  xp: number;
  level: number;
  totalMints: number;
  totalAudits: number;
  streak: number;
  achievements: Achievement[];
  chainStatus: ChainStatus;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  unlocked: boolean;
  unlockedAt?: string;
}

interface ChainStatus {
  height: number;
  totalArtifacts: number;
  isValid: boolean;
  pendingArtifacts: number;
}

// XP calculation system
const XP_REWARDS = {
  mint_evidence: 25,
  verify_evidence: 15,
  mine_block: 50,
  audit_chain: 100,
  first_mint: 100,
  streak_bonus: 10,
  high_value_evidence: 50, // For evidence > $50k
  perfect_verification: 75,
  chain_validation: 150
};

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_mint',
    name: 'First Evidence',
    description: 'Mint your first piece of evidence',
    icon: '🥇',
    xp: 100,
    unlocked: false
  },
  {
    id: 'high_roller',
    name: 'High Roller',
    description: 'Mint evidence worth over $100,000',
    icon: '💎',
    xp: 200,
    unlocked: false
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 7-day minting streak',
    icon: '🔥',
    xp: 300,
    unlocked: false
  },
  {
    id: 'chain_guardian',
    name: 'Chain Guardian',
    description: 'Successfully validate the entire blockchain',
    icon: '🛡️',
    xp: 500,
    unlocked: false
  },
  {
    id: 'evidence_master',
    name: 'Evidence Master',
    description: 'Mint 100 pieces of evidence',
    icon: '👑',
    xp: 1000,
    unlocked: false
  }
];

// ChittyChain MCP client
class ChittyChainMCPClient {
  private serverUrl: string = 'http://localhost:3100'; // Assuming MCP server runs on 3100

  async mintEvidence(artifacts: EvidenceArtifact[]): Promise<ChittyChainMintResult> {
    try {
      const response = await fetch(`${this.serverUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'chittychain_verified_mint',
          arguments: {
            artifacts,
            verificationLevel: 'legal',
            requireConsent: false, // Auto-approve for gamified experience
            minerEmail: 'evidence-game@chittychain.local'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('ChittyChain minting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async verifyOnly(artifacts: EvidenceArtifact[]): Promise<any> {
    try {
      const response = await fetch(`${this.serverUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'chittychain_verify_only',
          arguments: {
            artifacts,
            verificationLevel: 'legal',
            createSnapshot: true
          }
        })
      });

      return await response.json();
    } catch (error) {
      console.error('ChittyChain verification error:', error);
      return { success: false, error: error.message };
    }
  }

  async getChainStatus(): Promise<ChainStatus> {
    try {
      const response = await fetch(`${this.serverUrl}/mcp/resources/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uri: 'chittychain://status'
        })
      });

      const result = await response.json();
      const status = JSON.parse(result.contents[0].text);
      
      return {
        height: status.chainHeight,
        totalArtifacts: status.totalArtifacts,
        isValid: status.isValid,
        pendingArtifacts: status.pendingArtifacts
      };
    } catch (error) {
      console.error('ChittyChain status error:', error);
      return {
        height: 0,
        totalArtifacts: 0,
        isValid: false,
        pendingArtifacts: 0
      };
    }
  }

  async analyzePerformance(): Promise<any> {
    try {
      const response = await fetch(`${this.serverUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'chittychain_analyze_performance',
          arguments: { includeDistributions: true }
        })
      });

      return await response.json();
    } catch (error) {
      console.error('ChittyChain analysis error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Radial Progress Component
function RadialProgress({ value }: { value: number }) {
  const radius = 36;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="rgba(255,255,255,0.2)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#00FFC6"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-mono text-white">{value}%</span>
      </div>
    </div>
  );
}

// XP Notification Component
function XPNotification({ xp, reason, onComplete }: { xp: number; reason: string; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      className="fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
    >
      <div className="flex items-center space-x-2">
        <Star className="w-5 h-5" />
        <div>
          <div className="font-bold">+{xp} XP</div>
          <div className="text-sm opacity-90">{reason}</div>
        </div>
      </div>
    </motion.div>
  );
}

// Achievement Notification Component
function AchievementNotification({ achievement, onComplete }: { achievement: Achievement; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      className="fixed top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-lg shadow-xl z-50 max-w-sm"
    >
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{achievement.icon}</div>
        <div>
          <div className="font-bold text-lg">Achievement Unlocked!</div>
          <div className="font-semibold">{achievement.name}</div>
          <div className="text-sm opacity-90">{achievement.description}</div>
          <div className="text-sm font-mono">+{achievement.xp} XP</div>
        </div>
      </div>
    </motion.div>
  );
}

// Main Gamified Evidence Minting Interface
export default function GameifiedChittyChainUI() {
  const [client] = useState(() => new ChittyChainMCPClient());
  const [metrics, setMetrics] = useState<GameMetrics>({
    xp: 0,
    level: 1,
    totalMints: 0,
    totalAudits: 0,
    streak: 0,
    achievements: ACHIEVEMENTS,
    chainStatus: { height: 0, totalArtifacts: 0, isValid: false, pendingArtifacts: 0 }
  });

  const [pendingEvidence, setPendingEvidence] = useState<EvidenceArtifact[]>([
    {
      id: `EVIDENCE_${Date.now()}_1`,
      contentHash: '0x1234567890abcdef',
      statement: 'City Studio Major Wire Transfer',
      weight: 0.95,
      tier: 'FINANCIAL_INSTITUTION',
      type: 'WIRE_TRANSFER',
      caseId: 'CASE_2024_001',
      amount: '$100,000',
      reference: 'WT220720-CS-001',
      metadata: {
        bank: 'Wells Fargo',
        date: '2022-07-20',
        description: 'Property purchase wire'
      }
    },
    {
      id: `EVIDENCE_${Date.now()}_2`,
      contentHash: '0xabcdef1234567890',
      statement: 'City Studio Earnest Money',
      weight: 0.88,
      tier: 'FINANCIAL_INSTITUTION',
      type: 'EARNEST_MONEY',
      caseId: 'CASE_2024_001',
      amount: '$10,000',
      metadata: {
        bank: 'Chase Bank',
        date: '2022-07-15'
      }
    }
  ]);

  const [mintedEvidence, setMintedEvidence] = useState<EvidenceArtifact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'xp' | 'achievement'; data: any }>>([]);

  // Calculate level from XP
  const calculateLevel = (xp: number) => Math.floor(xp / 200) + 1;

  // Load chain status on mount
  useEffect(() => {
    const loadChainStatus = async () => {
      const status = await client.getChainStatus();
      setMetrics(prev => ({ ...prev, chainStatus: status }));
    };

    loadChainStatus();
    const interval = setInterval(loadChainStatus, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [client]);

  // Award XP and check achievements
  const awardXP = useCallback((amount: number, reason: string, evidence?: EvidenceArtifact) => {
    setMetrics(prev => {
      const newXP = prev.xp + amount;
      const newLevel = calculateLevel(newXP);
      const leveledUp = newLevel > prev.level;

      // Check for achievement unlocks
      const updatedAchievements = [...prev.achievements];
      const newlyUnlocked: Achievement[] = [];

      updatedAchievements.forEach(achievement => {
        if (!achievement.unlocked) {
          let shouldUnlock = false;

          switch (achievement.id) {
            case 'first_mint':
              shouldUnlock = prev.totalMints === 0;
              break;
            case 'high_roller':
              shouldUnlock = evidence && parseFloat(evidence.amount?.replace(/[$,]/g, '') || '0') > 100000;
              break;
            case 'streak_master':
              shouldUnlock = prev.streak >= 7;
              break;
            case 'chain_guardian':
              shouldUnlock = prev.totalAudits > 0 && prev.chainStatus.isValid;
              break;
            case 'evidence_master':
              shouldUnlock = prev.totalMints >= 100;
              break;
          }

          if (shouldUnlock) {
            achievement.unlocked = true;
            achievement.unlockedAt = new Date().toISOString();
            newlyUnlocked.push(achievement);
          }
        }
      });

      // Add notifications
      const newNotifications = [
        { id: Date.now().toString(), type: 'xp' as const, data: { xp: amount, reason } },
        ...newlyUnlocked.map(achievement => ({
          id: `${Date.now()}_${achievement.id}`,
          type: 'achievement' as const,
          data: achievement
        }))
      ];

      setNotifications(prev => [...prev, ...newNotifications]);

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        achievements: updatedAchievements
      };
    });
  }, []);

  // Handle evidence minting
  const handleMintEvidence = async (evidence: EvidenceArtifact) => {
    setIsLoading(true);
    try {
      const result = await client.mintEvidence([evidence]);
      
      if (result.success) {
        // Remove from pending and add to minted
        setPendingEvidence(prev => prev.filter(e => e.id !== evidence.id));
        setMintedEvidence(prev => [...prev, evidence]);

        // Update metrics
        setMetrics(prev => ({ 
          ...prev, 
          totalMints: prev.totalMints + 1,
          streak: prev.streak + 1
        }));

        // Award XP
        let xpAmount = XP_REWARDS.mint_evidence;
        let reason = 'Evidence Minted';

        // Bonus XP for high-value evidence
        if (evidence.amount && parseFloat(evidence.amount.replace(/[$,]/g, '')) > 50000) {
          xpAmount += XP_REWARDS.high_value_evidence;
          reason = 'High-Value Evidence Minted';
        }

        awardXP(xpAmount, reason, evidence);

        // Update chain status
        const status = await client.getChainStatus();
        setMetrics(prev => ({ ...prev, chainStatus: status }));

      } else {
        console.error('Minting failed:', result.error);
        alert(`Minting failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Minting error:', error);
      alert('Failed to mint evidence. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle evidence verification
  const handleVerifyEvidence = async (evidence: EvidenceArtifact) => {
    setIsLoading(true);
    try {
      const result = await client.verifyOnly([evidence]);
      
      if (result.success) {
        awardXP(XP_REWARDS.verify_evidence, 'Evidence Verified');
        
        // Show verification results
        alert(`Verification Complete!\nTrust Score: ${result.report?.summary?.averageTrustScore?.toFixed(2) || 'N/A'}\nRecommended for minting: ${result.report?.summary?.recommendedForMinting ? 'Yes' : 'No'}`);
      } else {
        alert(`Verification failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Failed to verify evidence. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chain audit
  const handleAuditChain = async () => {
    setIsLoading(true);
    try {
      const result = await client.analyzePerformance();
      
      if (result.success) {
        setMetrics(prev => ({ 
          ...prev, 
          totalAudits: prev.totalAudits + 1
        }));

        awardXP(XP_REWARDS.audit_chain, 'Blockchain Audited');
        
        // Show audit results
        const stats = result.statistics;
        alert(`Audit Complete!\nTotal Blocks: ${stats.totalBlocks}\nTotal Artifacts: ${stats.totalArtifacts}\nAverage Block Time: ${(stats.avgBlockTime / 1000).toFixed(2)}s`);
      } else {
        alert(`Audit failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Audit error:', error);
      alert('Failed to audit chain. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Calculate progress for different metrics
  const mintingProgress = Math.min((metrics.totalMints / 10) * 100, 100);
  const auditProgress = Math.min((metrics.totalAudits / 5) * 100, 100);
  const xpProgress = ((metrics.xp % 200) / 200) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      {/* Notifications */}
      <AnimatePresence>
        {notifications.map(notification => (
          notification.type === 'xp' ? (
            <XPNotification
              key={notification.id}
              xp={notification.data.xp}
              reason={notification.data.reason}
              onComplete={() => removeNotification(notification.id)}
            />
          ) : (
            <AchievementNotification
              key={notification.id}
              achievement={notification.data}
              onComplete={() => removeNotification(notification.id)}
            />
          )
        ))}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 text-center"
      >
        <h1 className="text-6xl font-extrabold text-[#00FFC6] drop-shadow-2xl">
          ⚡️ EvidenceChain Odyssey
        </h1>
        <p className="mt-3 text-xl text-gray-400">
          Real blockchain evidence minting with ChittyChain integration
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm font-mono text-gray-200">
          <span>Level: {metrics.level}</span>
          <span>XP: {metrics.xp}</span>
          <span>Mints: {metrics.totalMints}</span>
          <span>Chain Height: {metrics.chainStatus.height}</span>
          <span>Total Evidence: {metrics.chainStatus.totalArtifacts}</span>
          <button 
            onClick={handleAuditChain}
            disabled={isLoading}
            className="px-3 py-1 bg-[#00FFC6] text-black rounded-full hover:bg-[#33FFB8] transition disabled:opacity-50"
          >
            {isLoading ? 'Auditing...' : `Audit Chain for +${XP_REWARDS.audit_chain} XP`}
          </button>
        </div>
      </motion.header>

      {/* Evidence Status */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Evidence */}
        <Card className="bg-gray-850 border border-gray-700 rounded-3xl p-6 backdrop-blur-lg bg-opacity-30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending Evidence</span>
              <Clock className="w-6 h-6 text-yellow-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingEvidence.map((evidence) => (
              <div key={evidence.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{evidence.statement}</div>
                    <div className="text-sm text-gray-400">
                      {evidence.amount} • Weight: {evidence.weight} • {evidence.tier}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleVerifyEvidence(evidence)}
                      disabled={isLoading}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50"
                    >
                      Verify (+{XP_REWARDS.verify_evidence} XP)
                    </button>
                    <button
                      onClick={() => handleMintEvidence(evidence)}
                      disabled={isLoading}
                      className="px-3 py-1 bg-[#00FFC6] hover:bg-[#33FFB8] text-black rounded text-sm disabled:opacity-50"
                    >
                      Mint (+{XP_REWARDS.mint_evidence} XP)
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Minted Evidence */}
        <Card className="bg-gray-850 border border-gray-700 rounded-3xl p-6 backdrop-blur-lg bg-opacity-30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Minted Evidence</span>
              <ShieldCheck className="w-6 h-6 text-green-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mintedEvidence.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No evidence minted yet. Mint your first piece for +{XP_REWARDS.first_mint} XP bonus!
              </div>
            ) : (
              mintedEvidence.map((evidence) => (
                <div key={evidence.id} className="flex items-center space-x-3">
                  <ShieldCheck className="w-6 h-6 text-green-400" />
                  <div>
                    <div className="font-semibold">{evidence.statement}</div>
                    <div className="text-sm text-gray-400">
                      {evidence.amount} • Ref: {evidence.reference}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gamification Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Level Progress */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px #00FFC6' }}
          className="relative bg-gray-850 border border-gray-700 rounded-3xl p-6 backdrop-blur-lg bg-opacity-30"
        >
          <div className="absolute -top-4 right-4 bg-[#00FFC6] text-black rounded-full w-10 h-10 flex items-center justify-center font-bold">
            {metrics.level}
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-800 rounded-full">
              <Star className="w-6 h-6 text-[#00FFC6]" />
            </div>
            <h2 className="text-2xl font-bold">Level</h2>
          </div>

          <div className="mt-6 flex justify-center">
            <RadialProgress value={xpProgress} />
          </div>

          <div className="mt-6 text-center font-mono">
            <span className="text-sm text-gray-300">XP to Next Level</span>
            <span className="ml-2 text-lg font-semibold text-[#00FFC6]">
              {200 - (metrics.xp % 200)}
            </span>
          </div>
        </motion.div>

        {/* Minting Progress */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px #00FFC6' }}
          className="relative bg-gray-850 border border-gray-700 rounded-3xl p-6 backdrop-blur-lg bg-opacity-30"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-800 rounded-full">
              <PackageIcon className="w-6 h-6 text-[#00FFC6]" />
            </div>
            <h2 className="text-2xl font-bold">Minting</h2>
          </div>

          <div className="mt-6 flex justify-center">
            <RadialProgress value={mintingProgress} />
          </div>

          <div className="mt-6 text-center font-mono">
            <span className="text-sm text-gray-300">Minted</span>
            <span className="ml-2 text-lg font-semibold text-[#00FFC6]">
              {metrics.totalMints}
            </span>
          </div>

          <div className="mt-4 text-center">
            <div className="text-sm text-gray-400">
              Next goal: {Math.ceil(metrics.totalMints / 10) * 10} mints
            </div>
          </div>
        </motion.div>

        {/* Audit Progress */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px #00FFC6' }}
          className="relative bg-gray-850 border border-gray-700 rounded-3xl p-6 backdrop-blur-lg bg-opacity-30"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-800 rounded-full">
              <ShieldCheck className="w-6 h-6 text-[#00FFC6]" />
            </div>
            <h2 className="text-2xl font-bold">Audit</h2>
          </div>

          <div className="mt-6 flex justify-center">
            <RadialProgress value={auditProgress} />
          </div>

          <div className="mt-6 text-center font-mono">
            <span className="text-sm text-gray-300">Audits</span>
            <span className="ml-2 text-lg font-semibold text-[#00FFC6]">
              {metrics.totalAudits}
            </span>
          </div>

          <div className="mt-4 text-center">
            <button 
              onClick={handleAuditChain}
              disabled={isLoading}
              className="px-4 py-2 bg-[#00FFC6] text-black rounded-full hover:bg-[#33FFB8] transition disabled:opacity-50"
            >
              {isLoading ? 'Auditing...' : `Audit (+${XP_REWARDS.audit_chain} XP)`}
            </button>
          </div>
        </motion.div>

        {/* Chain Status */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px #00FFC6' }}
          className="relative bg-gray-850 border border-gray-700 rounded-3xl p-6 backdrop-blur-lg bg-opacity-30"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-800 rounded-full">
              <Database className="w-6 h-6 text-[#00FFC6]" />
            </div>
            <h2 className="text-2xl font-bold">Chain</h2>
          </div>

          <div className="mt-6 text-center">
            <div className="text-3xl font-bold text-[#00FFC6]">
              {metrics.chainStatus.height}
            </div>
            <div className="text-sm text-gray-400">Blocks</div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Artifacts:</span>
              <span className="text-[#00FFC6]">{metrics.chainStatus.totalArtifacts}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending:</span>
              <span className="text-yellow-400">{metrics.chainStatus.pendingArtifacts}</span>
            </div>
            <div className="flex justify-between">
              <span>Valid:</span>
              <span className={metrics.chainStatus.isValid ? 'text-green-400' : 'text-red-400'}>
                {metrics.chainStatus.isValid ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Achievements */}
      <div className="mt-10">
        <h2 className="text-3xl font-bold text-center mb-6">Achievements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {metrics.achievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ 
                scale: achievement.unlocked ? 1.1 : 0.9, 
                opacity: achievement.unlocked ? 1 : 0.5 
              }}
              className={`bg-gray-800 rounded-lg p-4 text-center border-2 ${
                achievement.unlocked 
                  ? 'border-yellow-400 bg-gradient-to-b from-yellow-400/20 to-orange-500/20' 
                  : 'border-gray-600'
              }`}
            >
              <div className="text-3xl mb-2">{achievement.icon}</div>
              <div className="font-bold text-sm">{achievement.name}</div>
              <div className="text-xs text-gray-400 mt-1">{achievement.description}</div>
              <div className="text-xs text-[#00FFC6] mt-2">+{achievement.xp} XP</div>
              {achievement.unlocked && achievement.unlockedAt && (
                <div className="text-xs text-yellow-400 mt-1">
                  Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}