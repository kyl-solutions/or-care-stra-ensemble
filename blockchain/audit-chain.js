// Or-care-stra Ensemble - Blockchain Audit Trail
// Immutable, tamper-evident logging for asset movements
// Uses SQLite with cryptographic chaining (Merkle-like structure)

import { createHash } from 'crypto';
import Database from 'better-sqlite3';
import { EventEmitter } from 'events';

export class AuditChain extends EventEmitter {
  constructor(dbPath) {
    super();
    this.db = new Database(dbPath);
    this.initializeChain();
  }

  // ============================================================================
  // CHAIN INITIALIZATION
  // ============================================================================

  initializeChain() {
    // Create blockchain tables if they don't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_blocks (
        block_number INTEGER PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        previous_hash VARCHAR(64) NOT NULL,
        merkle_root VARCHAR(64) NOT NULL,
        nonce INTEGER DEFAULT 0,
        block_hash VARCHAR(64) NOT NULL UNIQUE,
        event_count INTEGER DEFAULT 0,

        -- Block metadata
        validator_id VARCHAR(50) DEFAULT 'system',
        block_size_bytes INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS audit_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        block_number INTEGER,
        transaction_hash VARCHAR(64) NOT NULL UNIQUE,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

        -- Event data
        event_type VARCHAR(50) NOT NULL,
        asset_id INTEGER NOT NULL,
        asset_tag VARCHAR(50),

        -- Location data
        from_zone_id INTEGER,
        from_zone_name VARCHAR(100),
        to_zone_id INTEGER,
        to_zone_name VARCHAR(100),

        -- Additional data (JSON)
        event_data TEXT,

        -- Verification
        signature VARCHAR(128),
        verified BOOLEAN DEFAULT 0,

        FOREIGN KEY (block_number) REFERENCES audit_blocks(block_number)
      );

      CREATE INDEX IF NOT EXISTS idx_audit_tx_asset ON audit_transactions(asset_id);
      CREATE INDEX IF NOT EXISTS idx_audit_tx_block ON audit_transactions(block_number);
      CREATE INDEX IF NOT EXISTS idx_audit_tx_timestamp ON audit_transactions(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_tx_type ON audit_transactions(event_type);
    `);

    // Check if genesis block exists
    const genesisBlock = this.db.prepare('SELECT * FROM audit_blocks WHERE block_number = 0').get();

    if (!genesisBlock) {
      this.createGenesisBlock();
    }

    // Load chain state
    this.loadChainState();
  }

  createGenesisBlock() {
    const timestamp = new Date().toISOString();
    const genesisData = {
      message: 'Or-care-stra Ensemble Genesis Block',
      hospital: 'Chris Hani Baragwanath Academic Hospital',
      purpose: 'Digital Twin Asset Tracking Audit Trail',
      created: timestamp
    };

    const previousHash = '0'.repeat(64);
    const merkleRoot = this.hashData(JSON.stringify(genesisData));
    const blockHash = this.calculateBlockHash(0, previousHash, merkleRoot, timestamp, 0);

    this.db.prepare(`
      INSERT INTO audit_blocks (block_number, timestamp, previous_hash, merkle_root, nonce, block_hash, event_count)
      VALUES (0, ?, ?, ?, 0, ?, 0)
    `).run(timestamp, previousHash, merkleRoot, blockHash);

    console.log('[Blockchain] Genesis block created:', blockHash.substring(0, 16) + '...');
  }

  loadChainState() {
    const latestBlock = this.db.prepare(
      'SELECT * FROM audit_blocks ORDER BY block_number DESC LIMIT 1'
    ).get();

    this.currentBlockNumber = latestBlock?.block_number || 0;
    this.currentBlockHash = latestBlock?.block_hash || '0'.repeat(64);
    this.pendingTransactions = [];

    // Block creation settings
    this.blockInterval = 30000; // Create new block every 30 seconds
    this.maxTransactionsPerBlock = 100;

    console.log(`[Blockchain] Chain loaded - Block #${this.currentBlockNumber}`);
  }

  // ============================================================================
  // CRYPTOGRAPHIC FUNCTIONS
  // ============================================================================

  hashData(data) {
    return createHash('sha256').update(data).digest('hex');
  }

  calculateBlockHash(blockNumber, previousHash, merkleRoot, timestamp, nonce) {
    const blockData = `${blockNumber}${previousHash}${merkleRoot}${timestamp}${nonce}`;
    return this.hashData(blockData);
  }

  calculateTransactionHash(transaction) {
    const txData = JSON.stringify({
      timestamp: transaction.timestamp,
      event_type: transaction.event_type,
      asset_id: transaction.asset_id,
      from_zone_id: transaction.from_zone_id,
      to_zone_id: transaction.to_zone_id,
      event_data: transaction.event_data
    });
    return this.hashData(txData);
  }

  calculateMerkleRoot(transactions) {
    if (transactions.length === 0) {
      return this.hashData('empty');
    }

    let hashes = transactions.map(tx => tx.transaction_hash || this.calculateTransactionHash(tx));

    while (hashes.length > 1) {
      const newHashes = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left;
        newHashes.push(this.hashData(left + right));
      }
      hashes = newHashes;
    }

    return hashes[0];
  }

  // ============================================================================
  // TRANSACTION MANAGEMENT
  // ============================================================================

  addTransaction(eventData) {
    const timestamp = new Date().toISOString();

    // Ensure required fields have values (NOT NULL constraints in DB)
    const transaction = {
      timestamp,
      event_type: eventData.event_type || 'unknown',
      asset_id: eventData.asset_id || 0,
      asset_tag: eventData.asset_tag || null,
      from_zone_id: eventData.from_zone_id || null,
      from_zone_name: eventData.from_zone_name || null,
      to_zone_id: eventData.to_zone_id || null,
      to_zone_name: eventData.to_zone_name || null,
      event_data: JSON.stringify(eventData.metadata || {})
    };

    transaction.transaction_hash = this.calculateTransactionHash(transaction);

    // Store in pending transactions
    this.pendingTransactions.push(transaction);

    // Auto-create block if threshold reached
    if (this.pendingTransactions.length >= this.maxTransactionsPerBlock) {
      this.createBlock();
    }

    this.emit('transaction', transaction);

    return transaction.transaction_hash;
  }

  // ============================================================================
  // BLOCK CREATION
  // ============================================================================

  createBlock() {
    if (this.pendingTransactions.length === 0) {
      return null;
    }

    const timestamp = new Date().toISOString();
    const blockNumber = this.currentBlockNumber + 1;
    const previousHash = this.currentBlockHash;
    const transactions = [...this.pendingTransactions];

    // Calculate merkle root
    const merkleRoot = this.calculateMerkleRoot(transactions);

    // Simple proof-of-work (minimal for demo - just find a hash)
    let nonce = 0;
    let blockHash = this.calculateBlockHash(blockNumber, previousHash, merkleRoot, timestamp, nonce);

    // Insert block
    const blockInsert = this.db.prepare(`
      INSERT INTO audit_blocks (block_number, timestamp, previous_hash, merkle_root, nonce, block_hash, event_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const txInsert = this.db.prepare(`
      INSERT INTO audit_transactions (
        block_number, transaction_hash, timestamp, event_type, asset_id, asset_tag,
        from_zone_id, from_zone_name, to_zone_id, to_zone_name, event_data, verified
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    // Use transaction for atomicity
    const insertBlock = this.db.transaction(() => {
      blockInsert.run(
        blockNumber, timestamp, previousHash, merkleRoot, nonce, blockHash, transactions.length
      );

      for (const tx of transactions) {
        txInsert.run(
          blockNumber, tx.transaction_hash, tx.timestamp, tx.event_type, tx.asset_id, tx.asset_tag,
          tx.from_zone_id, tx.from_zone_name, tx.to_zone_id, tx.to_zone_name, tx.event_data
        );
      }
    });

    insertBlock();

    // Update chain state
    this.currentBlockNumber = blockNumber;
    this.currentBlockHash = blockHash;
    this.pendingTransactions = [];

    console.log(`[Blockchain] Block #${blockNumber} created - ${transactions.length} transactions`);

    this.emit('block', {
      block_number: blockNumber,
      block_hash: blockHash,
      transaction_count: transactions.length,
      timestamp
    });

    return {
      block_number: blockNumber,
      block_hash: blockHash,
      merkle_root: merkleRoot,
      transaction_count: transactions.length
    };
  }

  // ============================================================================
  // CHAIN VERIFICATION
  // ============================================================================

  verifyChain() {
    const blocks = this.db.prepare(
      'SELECT * FROM audit_blocks ORDER BY block_number ASC'
    ).all();

    const results = {
      valid: true,
      blocks_verified: 0,
      errors: []
    };

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      // Verify block hash
      const calculatedHash = this.calculateBlockHash(
        block.block_number,
        block.previous_hash,
        block.merkle_root,
        block.timestamp,
        block.nonce
      );

      if (calculatedHash !== block.block_hash) {
        results.valid = false;
        results.errors.push({
          block: block.block_number,
          error: 'Block hash mismatch',
          expected: block.block_hash,
          calculated: calculatedHash
        });
      }

      // Verify chain linkage (skip genesis)
      if (i > 0) {
        const previousBlock = blocks[i - 1];
        if (block.previous_hash !== previousBlock.block_hash) {
          results.valid = false;
          results.errors.push({
            block: block.block_number,
            error: 'Chain linkage broken',
            expected: previousBlock.block_hash,
            found: block.previous_hash
          });
        }
      }

      // Verify merkle root
      const transactions = this.db.prepare(
        'SELECT * FROM audit_transactions WHERE block_number = ?'
      ).all(block.block_number);

      if (transactions.length > 0) {
        const calculatedMerkle = this.calculateMerkleRoot(transactions);
        if (calculatedMerkle !== block.merkle_root) {
          results.valid = false;
          results.errors.push({
            block: block.block_number,
            error: 'Merkle root mismatch',
            expected: block.merkle_root,
            calculated: calculatedMerkle
          });
        }
      }

      results.blocks_verified++;
    }

    return results;
  }

  verifyTransaction(transactionHash) {
    const tx = this.db.prepare(
      'SELECT * FROM audit_transactions WHERE transaction_hash = ?'
    ).get(transactionHash);

    if (!tx) {
      return { valid: false, error: 'Transaction not found' };
    }

    // Recalculate hash
    const calculatedHash = this.calculateTransactionHash(tx);

    if (calculatedHash !== tx.transaction_hash) {
      return { valid: false, error: 'Transaction hash mismatch' };
    }

    // Verify block exists and is valid
    const block = this.db.prepare(
      'SELECT * FROM audit_blocks WHERE block_number = ?'
    ).get(tx.block_number);

    if (!block) {
      return { valid: false, error: 'Block not found' };
    }

    return {
      valid: true,
      transaction: tx,
      block: {
        number: block.block_number,
        hash: block.block_hash,
        timestamp: block.timestamp
      }
    };
  }

  // ============================================================================
  // QUERY INTERFACE
  // ============================================================================

  getChainStatus() {
    const latestBlock = this.db.prepare(
      'SELECT * FROM audit_blocks ORDER BY block_number DESC LIMIT 1'
    ).get();

    const totalTransactions = this.db.prepare(
      'SELECT COUNT(*) as count FROM audit_transactions'
    ).get();

    const last24h = this.db.prepare(`
      SELECT COUNT(*) as count FROM audit_transactions
      WHERE timestamp > datetime('now', '-24 hours')
    `).get();

    return {
      chain_height: latestBlock?.block_number || 0,
      latest_block_hash: latestBlock?.block_hash || null,
      latest_block_time: latestBlock?.timestamp || null,
      total_transactions: totalTransactions.count,
      transactions_24h: last24h.count,
      pending_transactions: this.pendingTransactions.length
    };
  }

  getBlock(blockNumber) {
    const block = this.db.prepare(
      'SELECT * FROM audit_blocks WHERE block_number = ?'
    ).get(blockNumber);

    if (!block) return null;

    const transactions = this.db.prepare(
      'SELECT * FROM audit_transactions WHERE block_number = ? ORDER BY id ASC'
    ).all(blockNumber);

    return { ...block, transactions };
  }

  getBlocks(limit = 10, offset = 0) {
    return this.db.prepare(`
      SELECT * FROM audit_blocks
      ORDER BY block_number DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  }

  getAssetHistory(assetId, limit = 50) {
    return this.db.prepare(`
      SELECT t.*, b.block_hash, b.timestamp as block_timestamp
      FROM audit_transactions t
      JOIN audit_blocks b ON t.block_number = b.block_number
      WHERE t.asset_id = ?
      ORDER BY t.timestamp DESC
      LIMIT ?
    `).all(assetId, limit);
  }

  getRecentTransactions(limit = 50) {
    return this.db.prepare(`
      SELECT t.*, b.block_hash
      FROM audit_transactions t
      LEFT JOIN audit_blocks b ON t.block_number = b.block_number
      ORDER BY t.timestamp DESC
      LIMIT ?
    `).all(limit);
  }

  searchTransactions(filters) {
    let query = `
      SELECT t.*, b.block_hash
      FROM audit_transactions t
      LEFT JOIN audit_blocks b ON t.block_number = b.block_number
      WHERE 1=1
    `;
    const params = [];

    if (filters.asset_id) {
      query += ' AND t.asset_id = ?';
      params.push(filters.asset_id);
    }

    if (filters.event_type) {
      query += ' AND t.event_type = ?';
      params.push(filters.event_type);
    }

    if (filters.from_date) {
      query += ' AND t.timestamp >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ' AND t.timestamp <= ?';
      params.push(filters.to_date);
    }

    if (filters.zone_id) {
      query += ' AND (t.from_zone_id = ? OR t.to_zone_id = ?)';
      params.push(filters.zone_id, filters.zone_id);
    }

    query += ' ORDER BY t.timestamp DESC LIMIT ?';
    params.push(filters.limit || 100);

    return this.db.prepare(query).all(...params);
  }

  // ============================================================================
  // BLOCK TIMER
  // ============================================================================

  startBlockTimer() {
    if (this.blockTimer) return;

    this.blockTimer = setInterval(() => {
      if (this.pendingTransactions.length > 0) {
        this.createBlock();
      }
    }, this.blockInterval);

    console.log(`[Blockchain] Block timer started (${this.blockInterval / 1000}s interval)`);
  }

  stopBlockTimer() {
    if (this.blockTimer) {
      clearInterval(this.blockTimer);
      this.blockTimer = null;
      console.log('[Blockchain] Block timer stopped');
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  close() {
    this.stopBlockTimer();

    // Create final block with pending transactions
    if (this.pendingTransactions.length > 0) {
      this.createBlock();
    }

    this.db.close();
  }
}

export default AuditChain;
