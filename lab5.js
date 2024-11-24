const express = require("express");
const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const program = new Command();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Параметри командного рядка
program
  .requiredOption('-h, --host <host>', 'Server Address')
  .requiredOption('-p, --port <port>', 'Server Port')
  .requiredOption('-c, --cache <cache>', 'Cache directory path');
program.parse(process.argv);
const options = program.opts();

// Перевірка шляху до кешу
const cacheDirectory = path.resolve(options.cache);
if (!fs.existsSync(cacheDirectory)) {
  console.error('Directory cache path is invalid');
  process.exit(1);
}

// Шлях до файлу з нотатками
const notesFilePath = path.join(cacheDirectory, 'notes.json');

// Функція для збереження нотаток у файл
function saveNotesToFile() {
  fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2));
}

// Функція для завантаження нотаток з файлу
function loadNotesFromFile() {
  if (fs.existsSync(notesFilePath)) {
    const data = fs.readFileSync(notesFilePath);
    return JSON.parse(data);
  }
  return [];
}

let notes = loadNotesFromFile();

// Ініціалізація Express.js
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger налаштування
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Note Service API',
      version: '1.0.0',
      description: 'API для роботи з нотатками',
    },
  },
  apis: ['./lab5.js'], // Переконайтеся, що у вашому файлі є відповідні коментарі
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Підключення Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Головний маршрут
app.get('/', (req, res) => {
  res.send("Hello world!");
});

// Запуск сервера
const server = app.listen(options.port, '0.0.0.0', () => {
  console.log(`Server started at http://${options.host}:${options.port}`);
});

server.on('error', (err) => {
  console.error("Server error: ", err);
});

/**
 * @swagger
 * /notes:
 *   get:
 *     description: Get all notes
 *     responses:
 *       200:
 *         description: A list of notes
 */
app.get('/notes', (req, res) => {
  res.status(200).send(notes);
});

/**
 * @swagger
 * /notes/{name}:
 *   get:
 *     description: Get a note by name
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Name of the note
 *     responses:
 *       200:
 *         description: The note details
 *       404:
 *         description: Note not found
 */
app.get('/notes/:name', (req, res) => {
  const name = req.params.name;
  const note = notes.find(note => note.name === name);
  if (!note) {
    return res.status(404).send("Note not found!");
  }
  res.send(note.text);
});

/**
 * @swagger
 * /notes/write:
 *   post:
 *     description: Create a new note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note_name
 *             properties:
 *               note_name:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Note created successfully
 *       400:
 *         description: Invalid request
 */
app.post('/notes/write', (req, res) => {
  const name = req.body.note_name;
  const text = req.body.note;
  if (!name) {
    return res.status(400).send("Name parameter is required.");
  }
  const existingNote = notes.find(note => note.name === name);
  if (existingNote) {
    return res.status(400).send("Note already exists!");
  }
  const newNote = { name, text: text || "No text provided" };
  notes.push(newNote);
  saveNotesToFile();
  res.status(201).send(newNote);
});

/**
 * @swagger
 * /notes/{name}:
 *   put:
 *     description: Update a note
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Name of the note
 *       - in: body
 *         name: note
 *         description: The note content to be updated
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - text
 *           properties:
 *             text:
 *               type: string
 *     responses:
 *       201:
 *         description: Note updated successfully
 *       404:
 *         description: Note not found
 */
app.put("/notes/:name", (req, res) => {
  const name = req.params.name;
  const newText = req.body.text;
  const note = notes.find(note => note.name === name);
  if (!note) {
    return res.status(404).send(`Note ${name} not found!`);
  }
  note.text = newText;
  saveNotesToFile();
  res.status(201).send(`Note ${name} updated successfully!`);
});

/**
 * @swagger
 * /delete/{name}:
 *   delete:
 *     description: Delete a note by name
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Name of the note
 *     responses:
 *       200:
 *         description: Note deleted successfully
 *       404:
 *         description: Note not found
 */
app.delete('/delete/:name', (req, res) => {
  const name = req.params.name;
  const noteIndex = notes.findIndex(note => note.name === name);
  if (noteIndex === -1) {
    return res.status(404).send(`Note ${name} not found!`);
  }
  notes.splice(noteIndex, 1);
  saveNotesToFile();
  res.send(`Note ${name} deleted successfully!`);
});

// Шлях для завантаження HTML форми
app.get("/UploadForm.html", (req, res) => {
  res.sendFile(path.join(__dirname, "UploadForm.html"));
});
