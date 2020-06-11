
const bent = require('bent')

/**
 * A class to help with the task of fetching information from
 * the docker registry
 */
RegistryContext = {
    registryURL: 'https://hub.docker.com/v2/',
    httpHeader: { },
    authToken: ''
}

/**
 * A helper object to host common tooling and methods.
 * Internal only stuff!
 */
class API {
    /**
     * Internal helper function to return an error object that
     * is transported by reject (from Promise)
     * 
     * @param {String} msg The message will given to new Error(msg)
     * @returns {Promise}
     */
    promisifiedError(msg) {
        return new Promise((_, reject) => reject(new Error(msg)))
    }

    /**
     * Removes a potential leading '/' and appends a '/' is none is set.
     * 
     * @param {String} path Path string after the base URL
     * @returns {String}
     */
    normalizeURLPath(path) {
        let normalizedPath = path;

        // remove leading / to have a consistent string
        if(path[0] === '/') {
            normalizedPath = path.substr(1)
        }
        
        // Also add a slash to the end of the path unless there is a ? in the path
        if (path.substr(-1) !== '/' && path.indexOf('?') === -1) {
            normalizedPath += '/'
        }
        return normalizedPath
    }

    /**
     * Returns an object with the "Authorization" header set, if we are logged in
     * Else the returned object is empty.
     * 
     * @returns {Object}
     */
    getHttpHeader(ctx) {
        let httpHeader = ctx.httpHeader
        if(ctx.authToken) {
            httpHeader.Authorization = `JWT ${ctx.authToken}`
        }
        return httpHeader
    }

    /**
     * Makes it even easier to call bent
     * 
     * @param {RegistryContext}
     * @param {String} method GET, DELETE, HEAD
     * @param {String} path Path after the base domain
     * @param {Object} [data] Data to be send within the body of our request (will be converted into JSON)
     * @returns {Promise}
     */
    request(ctx, method, path, data) {
        const req = bent(ctx.registryURL, method, 'json', this.getHttpHeader(ctx))
        return (data) ? req(this.normalizeURLPath(), data) : req(this.normalizeURLPath(path));
    }
}


// ========== Available Calls ====================

class Authenticator {
    #ctx = null

    /**
     * @param {RegistryContext} Gives the context for working with the registry
     */
    constructor(context) {
        this.#ctx = context
    }

    /**
     * Try to authenticate our user with username / password
     * @param {String} username 
     * @param {String} password 
     */
    login(username, password) {
        return API.request(this.#ctx, 'GET', 'users/login/', { username, password })
    }
}

class Repository {
    #api;
    #ctx;
    #user;
    #repository;

    /**
     * 
     * @param {RegistryContext} context
     * @param {String} user The docker registry user or organisation that hosts the repository
     * @param {String} repository The docker registry repository from the given user
     */
    constructor(context, user, repository) {
        this.#ctx = context
        this.#user = user.toLowerCase() // make user compliant with docker hub
        this.#repository = repository
        this.#api = new API()
    }

    info() {
        let user = this.#user
        let repository = this.#repository
        return this.#api.request(this.#ctx, 'GET', `repositories/${user}/${repository}`)
    }

    tags(page = 1, steps = 5) {
        let user = this.#user
        let repository = this.#repository
        return this.#api.request(this.#ctx, 'GET', `repositories/${user}/${repository}/tags?page_size=${steps}&page=${page}`)
    }
}

module.exports = {
    Context: RegistryContext,
    Authenticator: Authenticator,
    Repository: Repository,
}

