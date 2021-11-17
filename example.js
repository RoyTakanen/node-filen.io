const Filen = require('./filen');

const filen = new Filen('<email>', '<password>')

filen.login().then((status) => {
    console.log(status)
    
    filen.usage().then((info) => {
        console.log(info)
    })

    filen.list().then((folders) => {
        folders.forEach((folder) => {
            if (folder.is_default) {
                filen.list(folder.uuid).then((defaultFolder) => {
                    defaultFolder.forEach((folderContent) => {
                        if (folderContent.type === "upload") {
                            console.log(folderContent)
                            filen.download(folderContent)
                        }
                    })
                })
            }
        })
    })
})

