const axios = require('axios');
const crypto = require('crypto');
const sha512 = require('js-sha512').sha512;
const sha384 = require('js-sha512').sha384;
const sha256 = require('js-sha256').sha256;
const sha1 = require('sha1');
const md5 = require('md5');
const md4 = require('js-md4');
const md2 = require('js-md2');
const CryptoJS = require("crypto-js");

const decryptMetadata = (data, key) =>  {
	data = data.toString();
	key = key.toString();

	const sliced = data.slice(0, 8);

	if(sliced == "U2FsdGVk"){
        try {
            let decrypted = CryptoJS.AES.decrypt(data, key).toString(CryptoJS.enc.Utf8);    
            return decrypted
        } catch (error) {
            return "Failed to decrypt"
        }
	} else{
        console.log("Unsupported... Sorry :(");
        // TODO: do later... (i really need account with the new auth)
    }
}

function decryptFile(key, plaintext) {
    let nonce = getRandomIV();
    let cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
    let nonceCiphertextTag = Buffer.concat([
        nonce, 
        cipher.update(plaintext), 
        cipher.final(), 
        cipher.getAuthTag() // Fix: Get tag with cipher.getAuthTag() and concatenate: nonce|ciphertext|tag
    ]); 
    return nonceCiphertextTag.toString('base64');
}

module.exports = class Filen {
    constructor(email, password) {
        this.user = {
            email,
            password,
            pwHash: sha512(sha384(sha256(sha1(password)))) + sha512(md5(md4(md2(password))))
        }

        this.keys = new Object()
    }

    login() {
        return new Promise((resolve, reject) => {
            axios({
                method: 'post',
                url: 'https://api.filen.net/v1/auth/info',
                data: {
                    email: this.user.email,
                }
              })
            .then((response) => {
                const authVersion = response.data.data.authVersion
                if (authVersion == 1) {

                    axios({
                        method: 'post',
                        url: 'https://api.filen.net/v1/login',
                        data: {
                            authVersion,
                            email: this.user.email,
                            password: this.user.pwHash,
                            twoFactorKey: "XXXXXX"
                        }
                        })
                    .then((response) => {
                        this.keys.api = response.data.data.apiKey,
                        this.keys.master = sha1(sha512(this.user.password))

                        resolve("Logged in!")
                    })
                    .catch((error) => reject(error))
                
                } else {
                    reject('Unsupported auth version')
                }
            })
            .catch((error) => reject(error))
        })
    }

    usage() {
        return new Promise((resolve, reject) => {
            axios({
                method: 'post',
                url: 'https://api.filen.net/v1/user/usage',
                data: {
                    apiKey: this.keys.api
                }
            })
            .then((response) => resolve(response.data.data))
            .catch((error) => reject(error))
        })
    }

    list(folder=undefined) {
        return new Promise((resolve, reject) => {

            if (folder === undefined) {
                axios({
                    method: 'post',
                    url: 'https://api.filen.net/v1/user/baseFolders',
                    data: {
                        apiKey: this.keys.api
                    }
                })
                .then((response) => {
                    let folders = []
    
                    response.data.data.folders.forEach((respFolder) => {
    
                        let parsedFolder = {
                            type: "folder",
                            uuid: respFolder.uuid,
                            name: JSON.parse(decryptMetadata(respFolder.name, this.keys.master)).name,
                            color: respFolder.color,
                            favorited: respFolder.favorited === 1 ? true : false,
                            is_sync: respFolder.is_sync === 1 ? true : false,
                            is_default: respFolder.is_default === 1 ? true : false,
                        }
    
                        folders.push(parsedFolder)
                    })

                    resolve(folders)
                })
                .catch((error) => reject(error))   
            } else {
                axios({
                    method: 'post',
                    url: 'https://api.filen.net/v1/dir/content',
                    data: {
                        apiKey: this.keys.api,
                        page: 1,
                        folders: `[\"${folder}\"]`,
                        uuid: folder
                    }
                })
                .then((response) => {
                    let contents = []

                    if (response.data.data.folders) {
                        response.data.data.folders.forEach((respFolder) => {
    
                            let parsedFolder = {
                                type: "folder",
                                uuid: respFolder.uuid,
                                name: JSON.parse(decryptMetadata(respFolder.name, this.keys.master)).name,
                                color: respFolder.color,
                                favorited: respFolder.favorited === 1 ? true : false,
                                is_sync: respFolder.is_sync === 1 ? true : false,
                                is_default: respFolder.is_default === 1 ? true : false,
                            }
        
                            contents.push(parsedFolder)
                        })    
                    }

                    if (response.data.data.uploads) {
                        response.data.data.uploads.forEach((respUpload) => {
    
                            const metadata = JSON.parse(decryptMetadata(respUpload.metadata, this.keys.master))

                            let parsedUpload = {
                                type: "upload",
                                uuid: respUpload.uuid,
                                name: metadata.name,
                                size: metadata.size,
                                mime: metadata.mime,
                                lastModified: metadata.lastModified,
                                key: metadata.key,
                                chunks: respUpload.chunks,
                                bucket: respUpload.bucket,
                                region: respUpload.region,
                                favorited: respUpload.favorited === 1 ? true : false,
                                version: respUpload.version,
                            }
        
                            contents.push(parsedUpload)
                        })    
                    }
        
                    resolve(contents)
                })
                .catch((error) => reject(error))   
            }
        })
    }

    download(file) {
        return new Promise((resolve, reject) => {
            const region = file.region
            const bucket = file.bucket
            const uuid = file.uuid
            const chunks = file.chunks
            const key = file.key

            console.log(key)

            const data = "";

            for (let chunk = 0; chunk<chunks; chunk++) {
                axios({
                    method: 'get',
                    url: `https://down.filen.io/${region}/${bucket}/${uuid}/${chunk}`
                })
                .then((response) => {
                    console.log(decryptFile(key,response.data))
                })
                .catch((error) => reject(error))    
            }
        })
    }

    upload() {

    }
}
