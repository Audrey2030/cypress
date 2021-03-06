const _ = require('lodash')
const debug = require('debug')('cypress:cli:run')

const util = require('../util')
const spawn = require('./spawn')
const verify = require('../tasks/verify')
const { exitWithError, errors } = require('../errors')

// maps options collected by the CLI
// and forms list of CLI arguments to the server
const processRunOptions = (options = {}) => {
  debug('processing run options %o', options)

  const args = ['--run-project', options.project]

  if (options.browser) {
    args.push('--browser', options.browser)
  }

  if (options.ci) {
    // push to display the deprecation message
    args.push('--ci')

    // also automatically record
    args.push('--record', true)
  }

  if (options.ciBuildId) {
    args.push('--ci-build-id', options.ciBuildId)
  }

  if (options.config) {
    args.push('--config', options.config)
  }

  if (options.configFile !== undefined) {
    args.push('--config-file', options.configFile)
  }

  if (options.env) {
    args.push('--env', options.env)
  }

  if (options.exit === false) {
    args.push('--no-exit')
  }

  if (options.group) {
    args.push('--group', options.group)
  }

  if (options.headed) {
    args.push('--headed', options.headed)
  }

  if (options.headless) {
    if (options.headed) {
      // throw this error synchronously, it will be caught later on and
      // the details will be propagated to the promise chain
      const err = new Error()

      err.details = errors.incompatibleHeadlessFlags
      throw err
    }

    args.push('--headed', !options.headless)
  }

  // if key is set use that - else attempt to find it by environment variable
  if (options.key == null) {
    debug('--key is not set, looking up environment variable CYPRESS_RECORD_KEY')
    options.key = util.getEnv('CYPRESS_RECORD_KEY') || util.getEnv('CYPRESS_CI_KEY')
  }

  // if we have a key assume we're in record mode
  if (options.key) {
    args.push('--key', options.key)
  }

  if (options.outputPath) {
    args.push('--output-path', options.outputPath)
  }

  if (options.parallel) {
    args.push('--parallel')
  }

  if (options.port) {
    args.push('--port', options.port)
  }

  // if record is defined and we're not
  // already in ci mode, then send it up
  if (options.record != null && !options.ci) {
    args.push('--record', options.record)
  }

  // if we have a specific reporter push that into the args
  if (options.reporter) {
    args.push('--reporter', options.reporter)
  }

  // if we have a specific reporter push that into the args
  if (options.reporterOptions) {
    args.push('--reporter-options', options.reporterOptions)
  }

  // if we have specific spec(s) push that into the args
  if (options.spec) {
    args.push('--spec', options.spec)
  }

  if (options.tag) {
    args.push('--tag', options.tag)
  }

  return args
}

module.exports = {
  processRunOptions,
  // resolves with the number of failed tests
  start (options = {}) {
    _.defaults(options, {
      key: null,
      spec: null,
      reporter: null,
      reporterOptions: null,
      project: process.cwd(),
    })

    function run () {
      let args

      try {
        args = processRunOptions(options)
      } catch (err) {
        if (err.details) {
          return exitWithError(err.details)()
        }

        throw err
      }

      debug('run to spawn.start args %j', args)

      return spawn.start(args, {
        dev: options.dev,
      })
    }

    if (options.dev) {
      return run()
    }

    return verify.start()
    .then(run)
  },
}
