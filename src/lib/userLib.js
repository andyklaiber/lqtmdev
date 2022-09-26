'use strict';
const _ = require('lodash');
const {ObjectId} = require('mongodb');
const bcrypt = require('bcrypt');

class UserLib {
    constructor(logger, dbConns){
        this._logger = logger;
        this._collectionName = "users";
        this._dbClient = dbConns.getConnection('auth');
        this._usersCollection = this._dbClient.collection(this._collectionName);
    }

    _generateBcryptPass(password){
        let saltRounds = 10;

        return new Promise((resolve, reject)=>{
            bcrypt.genSalt(saltRounds, function(err, salt) {
                if (err){
                    this._logger.error({err, user: newUser}, "Error salting new user password.");
                    return reject(err);
                }
                bcrypt.hash(password, salt, function(err, hash) {
                    if (err){
                        this._logger.error({err, user: newUser}, "Error generating new user hash.");
                        return reject(err);
                    }
                    return resolve(hash);
                });
            });
        })
    }

    authenticate(username, password){
        let userId = null;

        return this.getUserByName(username)
            .then((result)=>{
                if (! _.isEmpty(result)){
                    userId = result._id;
                    return bcrypt.compare(password, result.password);
                } else {
                    return Promise.resolve(false);
                }
            })
            .then((isAuthenticated)=>{
                if (isAuthenticated){
                    return this.updateUser(userId, {lastLoginTime: new Date(Date.now()).toString()})
                        .then((userInfo)=>{ 
                            return Promise.resolve({isAuthenticated: true, userInfo: userInfo}) 
                        });
                } else {
                    return Promise.resolve({isAuthenticated: false})
                }
            })
    }

    getAllUsers(){
        return this._usersCollection.find({}, { projection: {password : 0} }).toArray()
            .catch((err)=>{
                logger.error({err}, "Error retrieving all users");
                throw err;
            })
    }

    getUserByName(name){
        return this._usersCollection.findOne({username: name})
            .catch((err)=>{
                logger.error({err}, "Error retrieving user by name");
                throw err;
            })
    }

    getUserById(id){
        return this._usersCollection.findOne({_id: ObjectId(id)}, { projection: {password : 0} })
            .catch((err)=>{
                logger.error({err}, "Error retrieving user by id");
                throw err;
            })
    }

    getUserByEmail(email){
        return this._usersCollection.findOne({email: email}, { projection: {password : 0} })
            .catch((err)=>{
                logger.error({err}, "Error retrieving user by email");
                throw err;
            })
    }

    updateUser(id, userInfo){
        let clonedUserInfo = _.cloneDeep(userInfo);

        let prom = Promise.resolve();
        
        if (userInfo.password){
            prom = this._generateBcryptPass(userInfo.password)
                .then((password)=>{
                    clonedUserInfo.password = password;
                    return Promise.resolve();
                })
        }

        if (userInfo.username){
            //We need to check for duplicate usernames.
            prom = prom.then(()=>{
                return this.getUserByName(userInfo.username)
                    .then((result)=>{
                        if (result && result.username){
                            throw new Error("ERR_DUP_USER");
                        }
                    })
            })
        }

        let ops = { "$set": clonedUserInfo };
        
        return prom
            .then(()=>{
                return this._usersCollection.findOneAndUpdate({"_id":ObjectId(id)}, ops, { returnDocument: 'after' })
            })
            .then((result)=>{
                if (! _.isEmpty(result)){
                    return result.value;
                } else {
                    throw new Error("User not found");
                }
            })
    }

    deleteUser(id){
        return this._usersCollection.deleteOne({"_id":ObjectId(id)});
    }

    createUser(userInfo){
        let newUser = _.cloneDeep(userInfo);

        return this.getUserByName(userInfo.username)
            .then((result)=>{
                if (result && result.username){
                    throw new Error("ERR_DUP_USER");
                }                 
                return this._generateBcryptPass(userInfo.password)
            })
            .then((hash)=>{
                newUser.password = hash;
                return this._usersCollection.insertOne(newUser);
            })    
            .then((result)=>{
                return this.getUserById(result.insertedId);
            })
    }
}

module.exports = UserLib;