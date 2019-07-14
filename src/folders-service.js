const FoldersService = {
    getAllFolders(knex) {
        return knex.select('*').from('noteful_folders')
    },
    insertNewFolder(knex, newFolder) {
        return knex
            .insert(newFolder)
            .into('noteful_folders')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .from('noteful_folders')
            .select('*')
            .where('id', id)
            .first()
    },
    deleteFolder(knex, id) {
        return knex('noteful_folders')
            .where({id})
            .delete()
    },
    updateFolder(knex, id, newFolderInfo) {
        return knex('noteful_folders')
            .where({id})
            .update(newFolderInfo)
    }

}

module.exports = FoldersService