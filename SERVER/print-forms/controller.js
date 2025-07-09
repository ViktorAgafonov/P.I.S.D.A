const fs = require('fs-extra');
const path = require('path');

class PrintFormsController {
  constructor() {
    this.formsDir = path.join(__dirname, 'data');
    this.formsFile = path.join(this.formsDir, 'forms.json');
    this.templatesDir = path.join(this.formsDir, 'templates');
    this.ensureDataDir();
  }

  async ensureDataDir() {
    await fs.ensureDir(this.formsDir);
    await fs.ensureDir(this.templatesDir);
    
    if (!await fs.pathExists(this.formsFile)) {
      await fs.writeJson(this.formsFile, [], { spaces: 2 });
    }
  }

  async getAllForms() {
    try {
      return await fs.readJson(this.formsFile);
    } catch (error) {
      console.error('Ошибка чтения печатных форм:', error);
      return [];
    }
  }

  async saveForms(forms) {
    try {
      await fs.writeJson(this.formsFile, forms, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Ошибка сохранения печатных форм:', error);
      return false;
    }
  }

  async getFormById(id) {
    const forms = await this.getAllForms();
    return forms.find(form => form.id === id);
  }

  async createForm(formData) {
    const forms = await this.getAllForms();
    
    const newForm = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description || '',
      template: formData.template || '',
      fields: formData.fields || [],
      settings: formData.settings || {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: formData.createdBy || 'system'
    };

    forms.push(newForm);
    await this.saveForms(forms);
    
    return newForm;
  }

  async updateForm(id, updates) {
    const forms = await this.getAllForms();
    const formIndex = forms.findIndex(form => form.id === id);
    
    if (formIndex === -1) {
      throw new Error('Печатная форма не найдена');
    }

    forms[formIndex] = {
      ...forms[formIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveForms(forms);
    return forms[formIndex];
  }

  async deleteForm(id) {
    const forms = await this.getAllForms();
    const formIndex = forms.findIndex(form => form.id === id);
    
    if (formIndex === -1) {
      throw new Error('Печатная форма не найдена');
    }

    forms.splice(formIndex, 1);
    await this.saveForms(forms);
    return true;
  }

  async generatePreview(formId, data = {}) {
    const form = await this.getFormById(formId);
    if (!form) {
      throw new Error('Печатная форма не найдена');
    }

    // Здесь будет логика генерации предварительного просмотра
    // Пока возвращаем базовую структуру
    return {
      form,
      data,
      preview: `Предварительный просмотр формы "${form.name}"`,
      timestamp: new Date().toISOString()
    };
  }

  async exportDocument(formId, data = {}) {
    const form = await this.getFormById(formId);
    if (!form) {
      throw new Error('Печатная форма не найдена');
    }

    // Здесь будет логика экспорта в различные форматы (PDF, DOC, XLSX)
    // Пока возвращаем базовую структуру
    return {
      form,
      data,
      document: {
        filename: `${form.name}_${Date.now()}.pdf`,
        content: `Документ сгенерирован из формы "${form.name}"`,
        format: 'pdf',
        size: '1024'
      },
      timestamp: new Date().toISOString()
    };
  }

  async printDocument(formId, data = {}) {
    const form = await this.getFormById(formId);
    if (!form) {
      throw new Error('Печатная форма не найдена');
    }

    // Здесь будет логика отправки на печать
    // Пока возвращаем базовую структуру
    return {
      form,
      data,
      printJob: {
        id: Date.now().toString(),
        status: 'queued',
        printer: 'default',
        copies: 1
      },
      timestamp: new Date().toISOString()
    };
  }

  // Получение списка печатных форм
  async getForms(req, res) {
    try {
      const forms = await this.getAllForms();
      res.json({ forms });
    } catch (error) {
      console.error('Ошибка получения печатных форм:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Получение печатной формы по ID
  async getForm(req, res) {
    try {
      const { id } = req.params;
      const form = await this.getFormById(id);
      
      if (!form) {
        return res.status(404).json({ error: 'Печатная форма не найдена' });
      }
      
      res.json({ form });
    } catch (error) {
      console.error('Ошибка получения печатной формы:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Создание новой печатной формы
  async createForm(req, res) {
    try {
      const formData = {
        ...req.body,
        createdBy: req.user?.username || 'system'
      };

      const newForm = await this.createForm(formData);
      res.status(201).json({
        message: 'Печатная форма успешно создана',
        form: newForm
      });
    } catch (error) {
      console.error('Ошибка создания печатной формы:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Обновление печатной формы
  async updateForm(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedForm = await this.updateForm(id, updates);
      res.json({
        message: 'Печатная форма успешно обновлена',
        form: updatedForm
      });
    } catch (error) {
      console.error('Ошибка обновления печатной формы:', error);
      if (error.message.includes('не найдена')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Удаление печатной формы
  async deleteForm(req, res) {
    try {
      const { id } = req.params;
      await this.deleteForm(id);
      
      res.json({
        message: 'Печатная форма успешно удалена'
      });
    } catch (error) {
      console.error('Ошибка удаления печатной формы:', error);
      if (error.message.includes('не найдена')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Предварительный просмотр формы
  async previewForm(req, res) {
    try {
      const { id } = req.params;
      const data = req.body || {};

      const preview = await this.generatePreview(id, data);
      res.json(preview);
    } catch (error) {
      console.error('Ошибка генерации предварительного просмотра:', error);
      if (error.message.includes('не найдена')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Экспорт документа
  async exportDocument(req, res) {
    try {
      const { id } = req.params;
      const data = req.body || {};

      const result = await this.exportDocument(id, data);
      res.json(result);
    } catch (error) {
      console.error('Ошибка экспорта документа:', error);
      if (error.message.includes('не найдена')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Печать документа
  async printDocument(req, res) {
    try {
      const { id } = req.params;
      const data = req.body || {};

      const result = await this.printDocument(id, data);
      res.json(result);
    } catch (error) {
      console.error('Ошибка печати документа:', error);
      if (error.message.includes('не найдена')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
}

module.exports = new PrintFormsController(); 