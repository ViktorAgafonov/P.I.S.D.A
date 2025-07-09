const express = require('express');
const router = express.Router();
const PrintFormsController = require('./controller');
const { authenticateToken, requireMinRole } = require('../auth/middleware');

// Все роуты требуют аутентификации и минимальной роли editor
router.use(authenticateToken);
router.use(requireMinRole('editor'));

// Получение списка печатных форм
router.get('/forms', PrintFormsController.getForms);

// Получение печатной формы по ID
router.get('/forms/:id', PrintFormsController.getForm);

// Создание новой печатной формы
router.post('/forms', PrintFormsController.createForm);

// Обновление печатной формы
router.put('/forms/:id', PrintFormsController.updateForm);

// Удаление печатной формы
router.delete('/forms/:id', PrintFormsController.deleteForm);

// Предварительный просмотр формы
router.get('/forms/:id/preview', PrintFormsController.previewForm);

// Экспорт документа
router.post('/forms/:id/export', PrintFormsController.exportDocument);

// Печать документа
router.post('/forms/:id/print', PrintFormsController.printDocument);

module.exports = router; 