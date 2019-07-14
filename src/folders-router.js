require('dotenv').config()

const express = require('express')
const xss = require('xss')
const FoldersService = require('./folders-service')
const path = require('path')

const foldersRouter = express.Router()
const jsonParser = express.json()

const serializedFolder = folder => ({
    id: folder.id,
    name: xss(folder.name)
})

foldersRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')

        FoldersService.getAllFolders(knexInstance)
            .then(folders => {
                res.json(folders.map(serializedFolder))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const { name } = req.body
        const newFolder = { name }

        for (const [key, value] of Object.entries(newFolder)) {
            if(value == null) {
                return res.status(400).json({
                    error: {
                        message: `Missing ${key} in post body`
                    }
                })
            }
        }
        FoldersService.insertNewFolder(knexInstance, newFolder)
        .then(folder => {
            res
            .status(201)
            .location(path.posix.join(req.originalUrl, `/${folder.id}`))
            .json({
                id: folder.id,
                name: xss(folder.name)
            })
        })
        .catch(next)
    })
foldersRouter.route('/:folder_id')
.all((req, res, next) => {
    const knexInstance = req.app.get('db')
    FoldersService.getById(knexInstance, req.params.folder_id)
    .then(folder => {
        if (!folder) {
            return res.status(404).json({
                error: {
                    message: 'Folder not found'
                }
            })
        }
        res.folder = folder
        next()
    })
    .catch(next)
})
.get((req, res, next) => {
    res.json(res.folder)
})
.delete((req, res, next) => {
    FoldersService.deleteFolder(req.app.get('db'), req.params.folder_id)
    .then(() => {
        res.status(204).end()
     }
    )
})
module.exports = foldersRouter