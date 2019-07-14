const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeFoldersArray } = require('../testdata/folders.fixtures')

describe('Folders endpoints', function() {
    let db
    const testFolders = makeFoldersArray()

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })
    after('disconnect from db', () => {
        db.destroy()
    })
    before('clean up table', () => db.raw('TRUNCATE noteful_folders, noteful_notes'))
    afterEach('cleanup', () => db.raw('TRUNCATE noteful_folders, noteful_notes'))

    describe('GET /api/folders', () => {
        context('given that the tables have data', () => {
            beforeEach('insert data', () => {
                return db.into('noteful_folders').insert(testFolders)
            })
            it('GET folders returns 200 and a list of all folders in db', () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, testFolders)
            })
        })
    })
    describe('GET /api/folders/:folder_id', () => {
        context('the database has data', () => {
            beforeEach('insert data', () => {
                return db.into('noteful_folders').insert(testFolders)
            })
            it(`Get /api/folders/:folder_id returns 200 and specific folder`, () => {
                const folderId = 2
                const expectedFolder = testFolders[folderId - 1]
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(200, expectedFolder)
            })
        })
    })
    describe('GET /api/folders', () => {
        context(`the database has no data`, () => {
            it(`Returns 200 and an empty array`, () => {
                return supertest(app)
                .get('/api/folders')
                .expect(200, [])
            })
        })
    })
    describe('GET /api/folders/:folder_id', () => {
        context(`the database has no data`, () => {
            it(`Returns 404 and an error message`, () => {
                const folderId = 600
                const error = {
                    error: {
                        message: 'Folder not found'
                    }
                }
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(404, error)
            })
        })
    })
    describe('POST /api/folders', () => {
        it('POSTS a folder to database returning status 201', function() {
            const newFolder = {

                name: 'Test folder'
            }
            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(newFolder.name)
                    expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`)
                })
                .then(postRes => {
                    supertest(app)
                    .get(`/articles/${postRes.body.id}`)
                    .expect(postRes.body)
                })
                
        })
    })
    describe(`DELETE /api/folders/:folder_id`, () => {
        context('there is data in the database', () => {
            beforeEach(`insert data`, () => db.into('noteful_folders').insert(testFolders))
            it(`returns 204`, () => {
                let folderId = 2
                let expectedFolders = testFolders.filter(item => item.id !== folderId)
                supertest(app)
                .delete(`/api/folders/${folderId}`)
                .expect(204)
                .then(res => {
                    supertest(app)
                    .get('/api/folders')
                    .expect(expectedFolders)
                })
            })
        })
        context(`there is no data`, () => {
            it(`responds with 404 and an error message`, () => {
                let folderId = 3
                supertest(app)
                .delete(`/api/folders/${folderId}`)
                .expect(404, { error: {
                    message: 'Folder not found'
                }})
            })
        })
    })
})