var APP_CONSTANTS = {
  APP_NAME: 'Control Tower Directiva',
  VERSION: '0.7.3',
  DATE_FORMAT: 'yyyy-MM-dd',
  DATETIME_FORMAT: 'yyyy-MM-dd HH:mm:ss',
  DEFAULT_TIMEZONE: 'America/Monterrey',
  AUTH: {
    SESSION_TTL_MINUTES: 180,
    IDLE_TTL_MINUTES: 30,
    PASSWORD_MAX_AGE_DAYS: 90,
    PASSWORD_MIN_LENGTH: 10,
    RESET_TOKEN_TTL_MINUTES: 15,
    LOCK_MAX_ATTEMPTS: 5,
    LOCK_MINUTES: 15
  },
  ROLES: {
    ADMIN: 'ADMIN',
    OPERATOR: 'OPERATOR'
  },
  STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    DRAFT: 'DRAFT'
  },
  PROJECT_STATUS: {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    BLOCKED: 'BLOCKED',
    AT_RISK: 'AT_RISK',
    DONE: 'DONE'
  },
  TASK_STATUS: {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
  },
  PRIORITY: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  },
  RISK: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH'
  },
  ALERT_SEVERITY: {
    INFO: 'INFO',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL'
  },
  FOLDER_KEYS: {
    PROJECTS: '01_Proyectos',
    ANALYSIS: '02_Analisis_Funcional',
    AUDIOS: '03_Audios',
    MINUTES: '04_Minutas',
    LOADS: '05_Cargas',
    TEMPLATES: '99_Plantillas'
  },
  SHEETS: {
    REALTIME_MONITORING: 'Monitoreo en linea',
    USERS: 'Usuarios',
    ROLES: 'Roles',
    CATALOGS: 'Catalogos',
    PROJECTS: 'Proyectos',
    TASKS: 'Tareas',
    TEAM_TASKS: 'SeguimientoActividades',
    ADVANCES: 'Avances',
    INCIDENTS: 'Incidencias',
    ALERTS: 'Alertas',
    DOCUMENTS: 'Documentos',
    AUDIOS: 'Audios',
    MINUTES: 'Minutas',
    FUNCTIONAL_ANALYSES: 'AnalisisFuncionales',
    FUNNEL_STEPS: 'EmbudoPasos',
    FUNNEL_CAUSES: 'EmbudoCausas',
    FUNNEL_EVENTS: 'EmbudoEventos',
    DATASETS: 'AnaliticaDataset',
    DATASET_ROWS: 'AnaliticaDatasetRows',
    DEPOSIT_CHARGE_MANUAL_RAW: 'DepositosCargosRawManual',
    DEPOSIT_CHARGE_RAW: 'DepositosCargosRaw',
    DEPOSIT_CHARGE_SUMMARY: 'DepositosCargosSummary',
    DEPOSIT_CHARGE_KPI: 'DepositosCargosKpi',
    DEPOSIT_CHARGE_CLIENT_DAY: 'DepositosCargosClientDay',
    DEPOSIT_CHARGE_LOADS: 'DepositosCargosCargas',
    SAVED_QUERIES: 'ConsultasGuardadas',
    HISTORICAL: 'SaldosVentasHistorico',
    HISTORICAL_LOADS: 'CargasHistoricas',
    PROTOTYPE_HEATMAP_EVENTS: 'PrototypeHeatmapEvents',
    TINCHO_MANUALS: 'TinchoManuales',
    TINCHO_QUERIES: 'TinchoConsultas',
    TINCHO_FEEDBACK: 'TinchoFeedback',
    TINCHO_ESCALATIONS: 'TinchoEscalaciones',
    AUDIT_LOG: 'Bitacora'
  },
  BLOCKED_ANALYTICS_FIELDS: [
    'nombre',
    'nombre_completo',
    'numero_cuenta',
    'cuenta',
    'curp',
    'rfc',
    'telefono',
    'correo',
    'email',
    'direccion'
  ]
};
