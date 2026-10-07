/**
 * Общая логика доступа и поиска отчётов для Code-нод n8n.
 * Копировать содержимое функций в ноду или подключать через require, если среда n8n это позволяет.
 */

const ROLES = Object.freeze({
  MASTER: 'master',
  MANAGER: 'manager',
  ADMIN: 'admin',
});

const STAFF_STATUS = Object.freeze({
  ACTIVE: 'active',
  DISABLED: 'disabled',
});

/**
 * @param {object} staffRow — строка staff_directory_pilot
 * @returns {boolean}
 */
function isStaffActive(staffRow) {
  return (
    staffRow &&
    String(staffRow.status ?? '') === STAFF_STATUS.ACTIVE &&
    String(staffRow.role ?? '') !== ''
  );
}

/**
 * @param {object} staffRow
 * @param {string} required — 'master' | 'manager' | 'admin'
 */
function hasAtLeastRole(staffRow, required) {
  const order = [ROLES.MASTER, ROLES.MANAGER, ROLES.ADMIN];
  const have = order.indexOf(String(staffRow?.role ?? ''));
  const need = order.indexOf(required);
  return have >= 0 && need >= 0 && have >= need;
}

/**
 * Нормализация ФИО для сравнения с текстом отчёта.
 * @param {string} value
 */
function normalizePersonName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Может ли пользователь видеть отчёт в поиске.
 *
 * @param {object} report — строка tg_reports_pilot
 * @param {object} viewer — staff_directory_pilot текущего пользователя
 * @param {string} viewerTelegramUserId
 */
function canViewReport(report, viewer, viewerTelegramUserId) {
  if (!isStaffActive(viewer)) return false;

  const role = String(viewer.role ?? '');

  if (role === ROLES.ADMIN) return true;

  if (role === ROLES.MANAGER) {
    const studio = String(viewer.studio ?? '').trim();
    return studio !== '' && String(report.studio ?? '').trim() === studio;
  }

  // master
  const staffId = String(viewer.id ?? '');
  const submittedBy = String(report.submitted_by_user_id ?? report.user_id ?? '');
  const viewerId = String(viewerTelegramUserId ?? '');

  if (staffId && String(report.master_staff_id ?? '') === staffId) return true;
  if (viewerId && submittedBy === viewerId) return true;

  const reportMaster = normalizePersonName(report.master);
  const viewerName = normalizePersonName(viewer.full_name);
  return reportMaster !== '' && viewerName !== '' && reportMaster === viewerName;
}

/**
 * Фильтрация списка отчётов для поиска (in-memory после чтения таблицы).
 *
 * @param {object[]} reports
 * @param {object} viewer
 * @param {string} viewerTelegramUserId
 * @param {object} [opts]
 * @param {string} [opts.clientQuery] — часть фамилии клиента
 * @param {number} [opts.daysBack] — окно по created_at
 * @param {number} [opts.limit]
 */
function filterReportsForSearch(reports, viewer, viewerTelegramUserId, opts = {}) {
  const clientQuery = normalizePersonName(opts.clientQuery).replace(/\s/g, '');
  const daysBack = Number(opts.daysBack ?? 30);
  const limit = Math.min(Number(opts.limit ?? 10), 50);

  const cutoff =
    daysBack > 0
      ? Date.now() - daysBack * 24 * 60 * 60 * 1000
      : 0;

  const filtered = (reports ?? [])
    .filter((row) => canViewReport(row, viewer, viewerTelegramUserId))
    .filter((row) => {
      if (!cutoff) return true;
      const t = new Date(row.created_at ?? row.updated_at ?? 0).getTime();
      return Number.isFinite(t) && t >= cutoff;
    })
    .filter((row) => {
      if (!clientQuery) return true;
      const client = normalizePersonName(row.client).replace(/\s/g, '');
      return client.includes(clientQuery);
    })
    .sort((a, b) => {
      const ta = new Date(a.created_at ?? 0).getTime();
      const tb = new Date(b.created_at ?? 0).getTime();
      return tb - ta;
    })
    .slice(0, limit);

  return filtered;
}

/**
 * Короткая подпись для inline-кнопки списка отчётов.
 */
function formatReportListLabel(report) {
  const date = String(report.created_at ?? '').slice(0, 10);
  const client = String(report.client ?? 'Клиент');
  const status = String(report.status ?? '');
  return `${date} · ${client}${status ? ` · ${status}` : ''}`;
}

module.exports = {
  ROLES,
  STAFF_STATUS,
  isStaffActive,
  hasAtLeastRole,
  normalizePersonName,
  canViewReport,
  filterReportsForSearch,
  formatReportListLabel,
};
