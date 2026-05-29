const express    = require('express');
const rateLimit  = require('express-rate-limit');
const { authenticate, authorize } = require('../middleware/auth');

const authCtrl     = require('../controllers/authController');
const projectsCtrl = require('../controllers/projectsController');
const tasksCtrl    = require('../controllers/tasksController');
const iotCtrl      = require('../controllers/iotController');
const aiCtrl       = require('../controllers/aiController');
const adminCtrl    = require('../controllers/adminController');
const contactRoute = require('./contact');

const router = express.Router();

// ── Public: contact form (website) ────────────────────────────────────────
const contactLimiter = rateLimit({ windowMs: 60*60*1000, max: 10 });
router.use('/contact', contactLimiter, contactRoute);

// ── Auth ──────────────────────────────────────────────────────────────────
router.post('/auth/login',   authCtrl.login);
router.post('/auth/refresh', authCtrl.refresh);
router.post('/auth/logout',  authCtrl.logout);
router.get ('/auth/me',      authenticate, authCtrl.me);

// ── Projects ──────────────────────────────────────────────────────────────
router.get ('/projects/map',   authenticate, projectsCtrl.getProjectsGeoJSON);
router.get ('/projects',       authenticate, projectsCtrl.getProjects);
router.get ('/projects/:id',   authenticate, projectsCtrl.getProject);
router.post('/projects',       authenticate, authorize('admin','manager'), projectsCtrl.createProject);
router.patch('/projects/:id',  authenticate, authorize('admin','manager'), projectsCtrl.updateProject);

// ── Tasks ─────────────────────────────────────────────────────────────────
router.get   ('/projects/:projectId/tasks', authenticate, tasksCtrl.getTasks);
router.post  ('/projects/:projectId/tasks', authenticate, authorize('admin','manager'), tasksCtrl.createTask);
router.patch ('/tasks/:id',                 authenticate, tasksCtrl.updateTask);
router.delete('/tasks/:id',                 authenticate, authorize('admin','manager'), tasksCtrl.deleteTask);

// ── IoT ───────────────────────────────────────────────────────────────────
router.get('/iot/sensors',              authenticate, iotCtrl.getSensors);
router.get('/iot/sensors/geojson',      authenticate, iotCtrl.getSensorsGeoJSON);
router.get('/iot/sensors/:id/readings', authenticate, iotCtrl.getSensorReadings);

// ── AI Assistant ──────────────────────────────────────────────────────────
router.get ('/ai/conversations',              authenticate, aiCtrl.getConversations);
router.post('/ai/conversations',              authenticate, aiCtrl.createConversation);
router.get ('/ai/conversations/:id/messages', authenticate, aiCtrl.getMessages);
router.post('/ai/conversations/:id/messages', authenticate, aiCtrl.sendMessage);

// ── Admin ─────────────────────────────────────────────────────────────────
router.get   ('/admin/stats',      authenticate, authorize('admin'), adminCtrl.getPlatformStats);
router.get   ('/admin/users',      authenticate, authorize('admin'), adminCtrl.getUsers);
router.post  ('/admin/users',      authenticate, authorize('admin'), adminCtrl.createUser);
router.patch ('/admin/users/:id',  authenticate, authorize('admin'), adminCtrl.updateUser);
router.delete('/admin/users/:id',  authenticate, authorize('admin'), adminCtrl.deleteUser);

module.exports = router;
