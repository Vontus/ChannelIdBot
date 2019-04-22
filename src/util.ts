import logger from './logger'

export default {
  getRequiredEnvVar (envVar: string): string {
    if (process.env.hasOwnProperty(envVar)) {
      return process.env[envVar] || ''
    } else {
      logger.error(`${envVar} is a required environment variable`)
      process.exit(400)
      return ''
    }
  }
}
