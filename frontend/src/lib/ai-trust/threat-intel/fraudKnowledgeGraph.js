/**
 * StudentHub AI — Fraud Campaign & Entity Knowledge Graph Engine
 * 
 * Graph Structure:
 * - Nodes: DOMAIN, URL, PHONE, EMAIL, DOCUMENT, QR, BANK_ACCOUNT, ORGANIZATION, CAMPAIGN, MESSAGE
 * - Edges: USES, IMPERSONATES, LINKS_TO, CLAIMS, SENT_FROM, PAYS_TO, CONTRADICTS, CORROBORATES, BELONGS_TO_CAMPAIGN
 * - Cross-Entity Consistency & Campaign Clustering
 */

export const NODE_TYPES = {
  DOMAIN: "DOMAIN",
  URL: "URL",
  PHONE: "PHONE",
  EMAIL: "EMAIL",
  DOCUMENT: "DOCUMENT",
  QR: "QR",
  BANK_ACCOUNT: "BANK_ACCOUNT",
  ORGANIZATION: "ORGANIZATION",
  CAMPAIGN: "CAMPAIGN",
  MESSAGE: "MESSAGE",
};

export const EDGE_TYPES = {
  USES: "USES",
  IMPERSONATES: "IMPERSONATES",
  LINKS_TO: "LINKS_TO",
  CLAIMS: "CLAIMS",
  PAYS_TO: "PAYS_TO",
  CONTRADICTS: "CONTRADICTS",
  CORROBORATES: "CORROBORATES",
  BELONGS_TO_CAMPAIGN: "BELONGS_TO_CAMPAIGN",
};

/**
 * Builds an in-memory Fraud Entity Knowledge Graph from multi-modal inputs
 */
export class FraudKnowledgeGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
  }

  addNode(id, type, properties = {}) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, type, properties, createdAt: Date.now() });
    }
    return this.nodes.get(id);
  }

  addEdge(sourceId, targetId, edgeType, properties = {}) {
    this.edges.push({
      sourceId,
      targetId,
      edgeType,
      properties,
      timestamp: Date.now(),
    });
  }

  /**
   * Correlates extracted entities and detects cross-modal contradictions
   */
  analyzeContradictions() {
    const contradictions = [];

    // 1. Check Domain vs Claimed Organization
    const domainClaims = this.edges.filter((e) => e.edgeType === EDGE_TYPES.IMPERSONATES || e.edgeType === EDGE_TYPES.CLAIMS);
    for (const claim of domainClaims) {
      const sourceNode = this.nodes.get(claim.sourceId);
      const targetOrg = this.nodes.get(claim.targetId);

      if (sourceNode?.type === NODE_TYPES.DOMAIN && targetOrg?.properties?.officialDomain) {
        if (!sourceNode.id.endsWith(targetOrg.properties.officialDomain)) {
          contradictions.push({
            type: "BRAND_DOMAIN_CONTRADICTION",
            claimedOrg: targetOrg.id,
            officialDomain: targetOrg.properties.officialDomain,
            actualDomain: sourceNode.id,
            severity: "CRITICAL",
            reason: `Tên miền '${sourceNode.id}' mạo danh tổ chức '${targetOrg.id}', nhưng không thuộc tên miền chính thức '${targetOrg.properties.officialDomain}'.`,
          });
        }
      }
    }

    // 2. Check Beneficiary Account vs Official Organization Beneficiary Name
    const paymentEdges = this.edges.filter((e) => e.edgeType === EDGE_TYPES.PAYS_TO || e.edgeType === EDGE_TYPES.CLAIMS);
    for (const edge of paymentEdges) {
      const sourceNode = this.nodes.get(edge.sourceId);
      const targetOrg = this.nodes.get(edge.targetId);

      if (sourceNode?.type === NODE_TYPES.BANK_ACCOUNT && targetOrg?.properties?.officialBeneficiary) {
        const holderName = sourceNode.properties?.holderName || "";
        const officialName = targetOrg.properties.officialBeneficiary || "";
        if (holderName && !officialName.toUpperCase().includes(holderName.toUpperCase())) {
          contradictions.push({
            type: "BENEFICIARY_NAME_CONTRADICTION",
            claimedOrg: targetOrg.id,
            officialBeneficiary: targetOrg.properties.officialBeneficiary,
            actualHolder: holderName,
            severity: "CRITICAL",
            reason: `Chủ tài khoản nhận tiền '${holderName}' là tài khoản cá nhân, không khớp với danh tính pháp nhân '${targetOrg.properties.officialBeneficiary}'.`,
          });
        }
      }
    }

    return contradictions;
  }
}

/**
 * Constructs and evaluates a Fraud Entity Graph for a given threat scenario
 */
export function buildFraudEntityGraph({
  claimedOrg = null,
  officialDomain = null,
  officialBeneficiary = null,
  observedDomain = null,
  observedUrl = null,
  observedQr = null,
  observedBank = null,
  observedAccount = null,
  observedHolder = null,
} = {}) {
  const graph = new FraudKnowledgeGraph();

  if (claimedOrg) {
    graph.addNode(`ORG_${claimedOrg}`, NODE_TYPES.ORGANIZATION, {
      name: claimedOrg,
      officialDomain,
      officialBeneficiary,
    });
  }

  if (observedDomain) {
    const domainNode = graph.addNode(observedDomain, NODE_TYPES.DOMAIN);
    if (claimedOrg) {
      graph.addEdge(domainNode.id, `ORG_${claimedOrg}`, EDGE_TYPES.IMPERSONATES);
    }
  }

  if (observedUrl) {
    const urlNode = graph.addNode(observedUrl, NODE_TYPES.URL);
    if (observedDomain) {
      graph.addEdge(urlNode.id, observedDomain, EDGE_TYPES.LINKS_TO);
    }
  }

  if (observedQr) {
    const qrNode = graph.addNode(`QR_${observedQr.slice(0, 32)}`, NODE_TYPES.QR, { payload: observedQr });
    if (claimedOrg) {
      graph.addEdge(qrNode.id, `ORG_${claimedOrg}`, EDGE_TYPES.CLAIMS);
    }
  }

  if (observedAccount) {
    const bankNode = graph.addNode(`ACC_${observedBank || "BANK"}_${observedAccount}`, NODE_TYPES.BANK_ACCOUNT, {
      bank: observedBank,
      accountNumber: observedAccount,
      holderName: observedHolder,
    });
    if (claimedOrg) {
      graph.addEdge(bankNode.id, `ORG_${claimedOrg}`, EDGE_TYPES.PAYS_TO);
    }
  }

  const contradictions = graph.analyzeContradictions();

  return {
    nodeCount: graph.nodes.size,
    edgeCount: graph.edges.length,
    contradictions,
    hasContradictions: contradictions.length > 0,
    graph,
  };
}
