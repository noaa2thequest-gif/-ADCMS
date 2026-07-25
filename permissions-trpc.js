// Permission Management Module - tRPC Version
const PermissionManager = {
  currentUser: null,
  users: [],
  permissions: [],
  auditLogs: [],
  selectedUserForGrant: null,
  selectedPermissionForGrant: null,
  selectedPermissionForRevoke: null,
  userPermissionsMap: {},

  async init() {
    this.setupEventListeners();
    await this.loadCurrentUser();
    await this.loadUsers();
    await this.loadPermissions();
    await this.loadAuditLogs();
    this.renderUsers();
    this.renderAuditLogs();
  },

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab));
    });

    // Grant permission button
    document.getElementById('grantPermissionBtn').addEventListener('click', () => this.showGrantModal());
    document.getElementById('closeGrantModal').addEventListener('click', () => this.hideGrantModal());
    document.getElementById('cancelGrantBtn').addEventListener('click', () => this.hideGrantModal());
    document.getElementById('confirmGrantBtn').addEventListener('click', () => this.confirmGrant());

    // Revoke permission modal
    document.getElementById('closeRevokeModal').addEventListener('click', () => this.hideRevokeModal());
    document.getElementById('cancelRevokeBtn').addEventListener('click', () => this.hideRevokeModal());
    document.getElementById('confirmRevokeBtn').addEventListener('click', () => this.confirmRevoke());

    // Search
    document.getElementById('userSearch').addEventListener('input', (e) => this.filterUsers(e.target.value));
    document.getElementById('auditSearch').addEventListener('input', (e) => this.filterAuditLogs(e.target.value));

    // Dark mode toggle
    document.getElementById('darkToggle').addEventListener('click', () => this.toggleDarkMode());

    // Menu toggle
    document.getElementById('menuBtn').addEventListener('click', () => this.toggleSidebar());

    // Permission select change
    document.getElementById('permissionSelect').addEventListener('change', (e) => {
      this.selectedPermissionForGrant = parseInt(e.target.value);
      this.updatePermissionDescription();
    });

    document.getElementById('permissionUserSelect').addEventListener('change', (e) => {
      this.selectedUserForGrant = parseInt(e.target.value);
    });
  },

  switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    const tabElement = document.getElementById(tabName + '-tab');
    if (tabElement) {
      tabElement.classList.add('active');
    }
    
    // Mark button as active
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
  },

  async loadCurrentUser() {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      this.currentUser = user;
      if (user) {
        document.getElementById('userName').textContent = user.name || 'User';
        document.getElementById('userRole').textContent = user.role || 'user';
        document.getElementById('userAvatar').textContent = (user.name || 'U').charAt(0).toUpperCase();
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  },

  async loadUsers() {
    try {
      // Fetch users from localStorage (ADCMS data)
      const usersData = JSON.parse(localStorage.getItem('users')) || [];
      this.users = usersData;
    } catch (error) {
      console.error('Failed to load users:', error);
      this.showToast('Failed to load users', 'error');
    }
  },

  async loadPermissions() {
    try {
      // Mock permissions data - in production this would come from tRPC
      this.permissions = [
        { id: 1, name: 'defect_create', description: 'Create defects', category: 'defects' },
        { id: 2, name: 'defect_edit', description: 'Edit defects', category: 'defects' },
        { id: 3, name: 'defect_delete', description: 'Delete defects', category: 'defects' },
        { id: 4, name: 'mel_manage', description: 'Manage MEL items', category: 'mel' },
        { id: 5, name: 'inventory_create', description: 'Create inventory items', category: 'inventory' },
        { id: 6, name: 'inventory_delete', description: 'Delete inventory items', category: 'inventory' },
        { id: 7, name: 'reports_export', description: 'Export reports', category: 'reports' },
        { id: 8, name: 'users_manage', description: 'Manage users', category: 'users' },
      ];
    } catch (error) {
      console.error('Failed to load permissions:', error);
      this.showToast('Failed to load permissions', 'error');
    }
  },

  async loadAuditLogs() {
    try {
      // Fetch audit logs from localStorage (would come from tRPC in production)
      const logs = JSON.parse(localStorage.getItem('auditLogs')) || [];
      this.auditLogs = logs;
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      this.showToast('Failed to load audit logs', 'error');
    }
  },

  async getUserPermissions(userId) {
    try {
      // Fetch user permissions from localStorage (would come from tRPC in production)
      const userPerms = JSON.parse(localStorage.getItem(`userPermissions_${userId}`)) || [];
      this.userPermissionsMap[userId] = userPerms;
      return userPerms;
    } catch (error) {
      console.error('Failed to load user permissions:', error);
    }
    return [];
  },

  renderUsers() {
    const container = document.getElementById('usersList');
    const emptyState = document.getElementById('usersEmpty');

    if (this.users.length === 0) {
      container.innerHTML = '';
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    container.innerHTML = this.users.map(user => `
      <div class="user-card">
        <div class="user-header">
          <div class="user-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
          <div class="user-info">
            <h4>${user.name || 'Unknown'}</h4>
            <p>${user.email || 'No email'}</p>
            <span class="role-badge">${user.role || 'user'}</span>
          </div>
        </div>
        <div class="user-permissions" id="perms-${user.id}">
          <p class="loading">Loading permissions...</p>
        </div>
        <div class="user-actions">
          <button class="action-btn" onclick="PermissionManager.grantToUser(${user.id})">+ Grant</button>
        </div>
      </div>
    `).join('');

    // Load permissions for each user
    this.users.forEach(user => this.loadAndRenderUserPermissions(user.id));
  },

  async loadAndRenderUserPermissions(userId) {
    const perms = await this.getUserPermissions(userId);
    const container = document.getElementById(`perms-${userId}`);

    if (perms.length === 0) {
      container.innerHTML = '<p class="no-perms">No permissions granted</p>';
      return;
    }

    container.innerHTML = `
      <div class="permissions-list">
        ${perms.map(perm => {
          const permName = typeof perm === 'string' ? perm : perm.name;
          const permId = typeof perm === 'string' ? this.permissions.find(p => p.name === perm)?.id : perm.id;
          return `
            <div class="permission-item">
              <span class="perm-name">${permName}</span>
              <button class="revoke-btn" onclick="PermissionManager.revokePermission(${userId}, ${permId})">✕</button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderAuditLogs() {
    const container = document.getElementById('auditList');
    const emptyState = document.getElementById('auditEmpty');

    if (this.auditLogs.length === 0) {
      container.innerHTML = '';
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    container.innerHTML = this.auditLogs.map(log => `
      <div class="audit-log-item">
        <div class="audit-header">
          <span class="audit-action ${log.action}">${this.formatAction(log.action)}</span>
          <span class="audit-time">${this.formatTime(log.timestamp)}</span>
        </div>
        <div class="audit-details">
          <p><strong>User ID:</strong> ${log.userId}</p>
          <p><strong>Changed By:</strong> ${log.changedBy || 'System'}</p>
          ${log.details ? `<p><strong>Details:</strong> ${log.details}</p>` : ''}
        </div>
      </div>
    `).join('');
  },

  showGrantModal() {
    const modal = document.getElementById('grantPermissionModal');
    const userSelect = document.getElementById('permissionUserSelect');
    const permSelect = document.getElementById('permissionSelect');

    // Populate user select
    userSelect.innerHTML = '<option value="">Select a user...</option>' +
      this.users.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');

    // Populate permission select
    permSelect.innerHTML = '<option value="">Select a permission...</option>' +
      this.permissions.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    modal.hidden = false;
  },

  hideGrantModal() {
    document.getElementById('grantPermissionModal').hidden = true;
    this.selectedUserForGrant = null;
    this.selectedPermissionForGrant = null;
  },

  updatePermissionDescription() {
    const descBox = document.getElementById('permissionDescription');
    if (!this.selectedPermissionForGrant) {
      descBox.hidden = true;
      return;
    }

    const perm = this.permissions.find(p => p.id === this.selectedPermissionForGrant);
    if (perm) {
      descBox.innerHTML = `<p>${perm.description || 'No description'}</p>`;
      descBox.hidden = false;
    }
  },

  grantToUser(userId) {
    this.selectedUserForGrant = userId;
    this.showGrantModal();
  },

  async confirmGrant() {
    if (!this.selectedUserForGrant || !this.selectedPermissionForGrant) {
      this.showToast('Please select both user and permission', 'error');
      return;
    }

    try {
      // Get the permission name
      const perm = this.permissions.find(p => p.id === this.selectedPermissionForGrant);
      const permName = perm?.name;

      // Store in localStorage (in production, this would call tRPC)
      const userPerms = await this.getUserPermissions(this.selectedUserForGrant);
      if (!userPerms.includes(permName)) {
        userPerms.push(permName);
        localStorage.setItem(`userPermissions_${this.selectedUserForGrant}`, JSON.stringify(userPerms));
      }

      // Add to audit log
      const auditLog = {
        id: this.auditLogs.length + 1,
        userId: this.selectedUserForGrant,
        action: 'permission_granted',
        details: JSON.stringify({ permissionId: this.selectedPermissionForGrant, permissionName: permName }),
        changedBy: this.currentUser?.id || 1,
        timestamp: new Date().toISOString()
      };
      this.auditLogs.unshift(auditLog);
      localStorage.setItem('auditLogs', JSON.stringify(this.auditLogs));

      this.showToast('Permission granted successfully', 'success');
      this.hideGrantModal();
      this.renderAuditLogs();
      await this.loadAndRenderUserPermissions(this.selectedUserForGrant);
    } catch (error) {
      console.error('Failed to grant permission:', error);
      this.showToast('Error granting permission', 'error');
    }
  },

  revokePermission(userId, permissionId) {
    this.selectedUserForGrant = userId;
    this.selectedPermissionForRevoke = permissionId;
    const perm = this.permissions.find(p => p.id === permissionId);
    document.getElementById('revokeConfirmText').textContent =
      `Are you sure you want to revoke "${perm?.name || 'this permission'}" from this user?`;
    document.getElementById('revokePermissionModal').hidden = false;
  },

  hideRevokeModal() {
    document.getElementById('revokePermissionModal').hidden = true;
    this.selectedPermissionForRevoke = null;
  },

  async confirmRevoke() {
    if (!this.selectedUserForGrant || !this.selectedPermissionForRevoke) {
      this.showToast('Invalid permission selection', 'error');
      return;
    }

    try {
      // Get the permission name
      const perm = this.permissions.find(p => p.id === this.selectedPermissionForRevoke);
      const permName = perm?.name;

      // Update localStorage (in production, this would call tRPC)
      const userPerms = await this.getUserPermissions(this.selectedUserForGrant);
      const index = userPerms.indexOf(permName);
      if (index > -1) {
        userPerms.splice(index, 1);
        localStorage.setItem(`userPermissions_${this.selectedUserForGrant}`, JSON.stringify(userPerms));
      }

      // Add to audit log
      const auditLog = {
        id: this.auditLogs.length + 1,
        userId: this.selectedUserForGrant,
        action: 'permission_revoked',
        details: JSON.stringify({ permissionId: this.selectedPermissionForRevoke, permissionName: permName }),
        changedBy: this.currentUser?.id || 1,
        timestamp: new Date().toISOString()
      };
      this.auditLogs.unshift(auditLog);
      localStorage.setItem('auditLogs', JSON.stringify(this.auditLogs));

      this.showToast('Permission revoked successfully', 'success');
      this.hideRevokeModal();
      this.renderAuditLogs();
      await this.loadAndRenderUserPermissions(this.selectedUserForGrant);
    } catch (error) {
      console.error('Failed to revoke permission:', error);
      this.showToast('Error revoking permission', 'error');
    }
  },

  filterUsers(searchTerm) {
    const filtered = this.users.filter(u =>
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const container = document.getElementById('usersList');
    const emptyState = document.getElementById('usersEmpty');

    if (filtered.length === 0) {
      container.innerHTML = '';
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    container.innerHTML = filtered.map(user => `
      <div class="user-card">
        <div class="user-header">
          <div class="user-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
          <div class="user-info">
            <h4>${user.name || 'Unknown'}</h4>
            <p>${user.email || 'No email'}</p>
            <span class="role-badge">${user.role || 'user'}</span>
          </div>
        </div>
        <div class="user-permissions" id="perms-${user.id}">
          <p class="loading">Loading permissions...</p>
        </div>
        <div class="user-actions">
          <button class="action-btn" onclick="PermissionManager.grantToUser(${user.id})">+ Grant</button>
        </div>
      </div>
    `).join('');

    filtered.forEach(user => this.loadAndRenderUserPermissions(user.id));
  },

  filterAuditLogs(searchTerm) {
    const filtered = this.auditLogs.filter(log =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const container = document.getElementById('auditList');
    const emptyState = document.getElementById('auditEmpty');

    if (filtered.length === 0) {
      container.innerHTML = '';
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    container.innerHTML = filtered.map(log => `
      <div class="audit-log-item">
        <div class="audit-header">
          <span class="audit-action ${log.action}">${this.formatAction(log.action)}</span>
          <span class="audit-time">${this.formatTime(log.timestamp)}</span>
        </div>
        <div class="audit-details">
          <p><strong>User ID:</strong> ${log.userId}</p>
          <p><strong>Changed By:</strong> ${log.changedBy || 'System'}</p>
          ${log.details ? `<p><strong>Details:</strong> ${log.details}</p>` : ''}
        </div>
      </div>
    `).join('');
  },

  formatAction(action) {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleString();
  },

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.hidden = false;
    setTimeout(() => toast.hidden = true, 3000);
  },

  toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  },

  toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  PermissionManager.init();
  // Load sidebar navigation
  if (window.renderSidebar) {
    window.renderSidebar();
  }
});
