require('dotenv').config()

const express = require('express')
const xss = require('xss')
const path = require('path')
const NotesService = require('./notes-service')

const notesRouter = express.Router()
const jsonParser = express.json()

notesRouter
.route('/')
.get((req, res, next) => {
    const knexInstance = req.app.get('db')

    NotesService.getAllNotes(knexInstance)
    .then(notes => {
        res.json(notes)
    })
    .catch(next)
})
.post(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get('db')
    const { name, content, folderid } = req.body
    const newNote = { name, content, folderid }
    for (const [key, value] of Object.entries(newNote)) {
        if(value == null) {
            return res.status(400).json({
                error: {
                    message: `Missing ${key} in post body`
                }
            })
        }
    }

    NotesService.insertNote(knexInstance, newNote)
    .then(note => {
        res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${note.id}`))
        .json({
            id: note.id,
            name: note.name,
            content: note.content,
            folderid: note.folderid
        })
    }).catch(next)
})
notesRouter
    .route('/:note_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        NotesService.getById(knexInstance, req.params.note_id)
            .then(note => {
                if(!note) {
                    return res.status(404).json({
                        error: {
                            message: 'Note note found'
                        }
                    })
                }
                res.note = note
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json(res.note)
    })
    .delete((req, res, next) => {
        NotesService.deleteNote(req.app.get('db'), req.params.note_id)
            .then(() => {
                res.status(204).end()
                }
            )
    })
module.exports = notesRouter