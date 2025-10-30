import path from 'path'
import fs from 'fs'
import yaml from 'yaml'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'

export function mountDocs(app: Express) {
  const file = fs.readFileSync(path.join(process.cwd(), 'openapi.yaml'), 'utf8')
  const spec = yaml.parse(file)
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec))
}
