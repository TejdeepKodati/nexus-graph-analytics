import { EnterpriseDataset } from '../types/graph';

export const enterpriseDatasets: EnterpriseDataset[] = [
  {
    id: 'shell-fraud-ring',
    title: 'Cross-Border Shell Network & Circular Fraud Ring',
    description: 'Multi-jurisdictional shell entities cycling over $12.4M in layered transfers to conceal ultimate beneficial ownership.',
    nodes: [
      { id: 'SHELL-01', name: 'Apex Zenith Trading Ltd', type: 'HOLDING_COMPANY', riskScore: 0.92, jurisdiction: 'BVI', flagged: true },
      { id: 'SHELL-02', name: 'Vanguard Marquee B.V.', type: 'CORPORATION', riskScore: 0.88, jurisdiction: 'Netherlands', flagged: true },
      { id: 'SHELL-03', name: 'Coral Reef Offshore Inc', type: 'BANK_ACCOUNT', riskScore: 0.95, jurisdiction: 'Cayman Islands', flagged: true },
      { id: 'SHELL-04', name: 'Silverstone Logistics LLC', type: 'CORPORATION', riskScore: 0.84, jurisdiction: 'Cyprus', flagged: true },
      { id: 'CORP-01', name: 'OmniGlobal Retail Corp', type: 'CORPORATION', riskScore: 0.35, jurisdiction: 'USA' },
      { id: 'CORP-02', name: 'TransContinental Freight', type: 'SUPPLIER', riskScore: 0.28, jurisdiction: 'Germany' },
      { id: 'BENEF-01', name: 'V. Sterling (Beneficiary)', type: 'BENEFICIARY', riskScore: 0.96, jurisdiction: 'Switzerland', flagged: true },
      { id: 'BANK-01', name: 'Alpine Custody Bank', type: 'BANK_ACCOUNT', riskScore: 0.42, jurisdiction: 'Liechtenstein' },
      { id: 'CORP-03', name: 'Pacific Horizon Metals', type: 'CORPORATION', riskScore: 0.31, jurisdiction: 'Singapore' },
      { id: 'SHELL-05', name: 'BreezeGate Holdings SA', type: 'HOLDING_COMPANY', riskScore: 0.89, jurisdiction: 'Panama', flagged: true },
      { id: 'SUPP-01', name: 'Nordic Raw Minerals ApS', type: 'SUPPLIER', riskScore: 0.18, jurisdiction: 'Denmark' },
      { id: 'CORP-04', name: 'Helix Energy Distribution', type: 'CORPORATION', riskScore: 0.22, jurisdiction: 'UK' }
    ],
    edges: [
      // Circular kickback cycle: SHELL-01 -> SHELL-02 -> SHELL-03 -> SHELL-04 -> SHELL-01
      { id: 'e1', source: 'SHELL-01', target: 'SHELL-02', weight: 3200000, type: 'SHELL_TRANSFER' },
      { id: 'e2', source: 'SHELL-02', target: 'SHELL-03', weight: 3150000, type: 'SHELL_TRANSFER' },
      { id: 'e3', source: 'SHELL-03', target: 'SHELL-04', weight: 3080000, type: 'SHELL_TRANSFER' },
      { id: 'e4', source: 'SHELL-04', target: 'SHELL-01', weight: 2950000, type: 'SHELL_TRANSFER' },
      
      // Funneling to beneficiary
      { id: 'e5', source: 'SHELL-03', target: 'BENEF-01', weight: 1400000, type: 'TRANSACTION' },
      { id: 'e6', source: 'SHELL-05', target: 'SHELL-01', weight: 850000, type: 'OWNERSHIP' },
      { id: 'e7', source: 'CORP-01', target: 'SHELL-01', weight: 4500000, type: 'TRANSACTION' },
      { id: 'e8', source: 'CORP-01', target: 'CORP-02', weight: 1800000, type: 'SUPPLY_CONTRACT' },
      { id: 'e9', source: 'CORP-02', target: 'SUPP-01', weight: 920000, type: 'SUPPLY_CONTRACT' },
      { id: 'e10', source: 'CORP-03', target: 'BANK-01', weight: 2200000, type: 'TRANSACTION' },
      { id: 'e11', source: 'CORP-04', target: 'BANK-01', weight: 1600000, type: 'TRANSACTION' },
      { id: 'e12', source: 'BANK-01', target: 'SHELL-02', weight: 950000, type: 'SHELL_TRANSFER' }
    ]
  },
  {
    id: 'supply-chain-risk',
    title: 'Tier-1/Tier-2 Semiconductor & Auto Supply Chain',
    description: 'Single-point-of-failure and concentration risk mapping across sub-tier semiconductor suppliers and OEM assembly plants.',
    nodes: [
      { id: 'OEM-01', name: 'Apex Motors Global', type: 'CORPORATION', riskScore: 0.25, jurisdiction: 'USA' },
      { id: 'TIER1-01', name: 'Boschmann Powertrain GmbH', type: 'SUPPLIER', riskScore: 0.30, jurisdiction: 'Germany' },
      { id: 'TIER1-02', name: 'DensoSys Electronics', type: 'SUPPLIER', riskScore: 0.28, jurisdiction: 'Japan' },
      { id: 'TIER2-CHIP', name: 'SiliconPinnacle Foundry', type: 'SUPPLIER', riskScore: 0.85, jurisdiction: 'Taiwan', flagged: true },
      { id: 'TIER2-SENSOR', name: 'QuantumMEMS Labs', type: 'SUPPLIER', riskScore: 0.45, jurisdiction: 'South Korea' },
      { id: 'RAW-LITH', name: 'Atacama Minerals Chile', type: 'SUPPLIER', riskScore: 0.62, jurisdiction: 'Chile' },
      { id: 'RAW-NEO', name: 'Baotou Rare Earth Mining', type: 'SUPPLIER', riskScore: 0.78, jurisdiction: 'China', flagged: true },
      { id: 'LOG-01', name: 'MaerskLine Oceanic Transport', type: 'CORPORATION', riskScore: 0.33, jurisdiction: 'Denmark' },
      { id: 'PLANT-01', name: 'Apex Spartanburg Assembly', type: 'CORPORATION', riskScore: 0.20, jurisdiction: 'USA' },
      { id: 'PLANT-02', name: 'Apex Leipzig EV Factory', type: 'CORPORATION', riskScore: 0.22, jurisdiction: 'Germany' }
    ],
    edges: [
      { id: 'sc1', source: 'RAW-NEO', target: 'TIER2-CHIP', weight: 4500000, type: 'SUPPLY_CONTRACT' },
      { id: 'sc2', source: 'TIER2-CHIP', target: 'TIER1-01', weight: 8900000, type: 'SUPPLY_CONTRACT' },
      { id: 'sc3', source: 'TIER2-CHIP', target: 'TIER1-02', weight: 7500000, type: 'SUPPLY_CONTRACT' },
      { id: 'sc4', source: 'RAW-LITH', target: 'TIER1-01', weight: 6200000, type: 'SUPPLY_CONTRACT' },
      { id: 'sc5', source: 'TIER2-SENSOR', target: 'TIER1-02', weight: 3400000, type: 'SUPPLY_CONTRACT' },
      { id: 'sc6', source: 'TIER1-01', target: 'PLANT-01', weight: 14500000, type: 'SUPPLY_CONTRACT' },
      { id: 'sc7', source: 'TIER1-01', target: 'PLANT-02', weight: 12000000, type: 'SUPPLY_CONTRACT' },
      { id: 'sc8', source: 'TIER1-02', target: 'PLANT-01', weight: 9800000, type: 'SUPPLY_CONTRACT' },
      { id: 'sc9', source: 'PLANT-01', target: 'OEM-01', weight: 25000000, type: 'TRANSACTION' },
      { id: 'sc10', source: 'PLANT-02', target: 'OEM-01', weight: 22000000, type: 'TRANSACTION' },
      { id: 'sc11', source: 'LOG-01', target: 'PLANT-01', weight: 1500000, type: 'TRANSACTION' }
    ]
  },
  {
    id: 'procurement-conflict',
    title: 'Enterprise Procurement Collusion & Undisclosed Ties',
    description: 'Conflict of interest network revealing undisclosed executive board cross-ownership and bid-rigging patterns.',
    nodes: [
      { id: 'ENTERPRISE', name: 'Global Energy Utilities Plc', type: 'CORPORATION', riskScore: 0.15, jurisdiction: 'UK' },
      { id: 'EXEC-01', name: 'Richard Hayes (Chief Procurement)', type: 'BENEFICIARY', riskScore: 0.89, jurisdiction: 'UK', flagged: true },
      { id: 'BIDDER-A', name: 'Apex Infrastructure Ltd', type: 'SUPPLIER', riskScore: 0.76, jurisdiction: 'UK', flagged: true },
      { id: 'BIDDER-B', name: 'Pinnacle Turbines SA', type: 'SUPPLIER', riskScore: 0.72, jurisdiction: 'Ireland', flagged: true },
      { id: 'HOLDING-X', name: 'Crestline Secret Capital Trust', type: 'HOLDING_COMPANY', riskScore: 0.94, jurisdiction: 'Jersey', flagged: true },
      { id: 'CONSULT-01', name: 'Beacon Project Advisors', type: 'CORPORATION', riskScore: 0.45, jurisdiction: 'UK' },
      { id: 'BANK-ACC', name: 'Sterling Private Banking', type: 'BANK_ACCOUNT', riskScore: 0.65, jurisdiction: 'Gibraltar' }
    ],
    edges: [
      { id: 'pc1', source: 'ENTERPRISE', target: 'EXEC-01', weight: 420000, type: 'TRANSACTION' },
      { id: 'pc2', source: 'EXEC-01', target: 'HOLDING-X', weight: 1200000, type: 'OWNERSHIP' },
      { id: 'pc3', source: 'HOLDING-X', target: 'BIDDER-A', weight: 850000, type: 'OWNERSHIP' },
      { id: 'pc4', source: 'HOLDING-X', target: 'BIDDER-B', weight: 850000, type: 'OWNERSHIP' },
      { id: 'pc5', source: 'BIDDER-A', target: 'ENTERPRISE', weight: 18500000, type: 'SUPPLY_CONTRACT' },
      { id: 'pc6', source: 'BIDDER-B', target: 'ENTERPRISE', weight: 17800000, type: 'SUPPLY_CONTRACT' },
      { id: 'pc7', source: 'BIDDER-A', target: 'BANK-ACC', weight: 2400000, type: 'SHELL_TRANSFER' },
      { id: 'pc8', source: 'BANK-ACC', target: 'EXEC-01', weight: 1800000, type: 'TRANSACTION' }
    ]
  }
];
