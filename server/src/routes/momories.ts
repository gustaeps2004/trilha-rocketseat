import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { z } from 'zod'

export async function memoriesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request) =>{
    await request.jwtVerify()
  })

  app.get('/memories', async (request) => {
    const memories = await prisma.memory.findMany({
      where: {
        userId: request.user.sub,
      },
      orderBy: {
        createdAt: 'asc',
      }
    })

    return memories.map(memory => {
      return {
        id: memory.id,
        coverUrl: memory.coverurl,
        excerpt: memory.content.substring(0, 115).concat('...'),
      }
    })
  })

  app.get('/memories/:id', async (request, reply) =>{
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const memory = await prisma.memory.findUniqueOrThrow({
      where: {
        id,
      }
    })

    if(!memory.isPublic && memory.userId != request.user.sub){
      return reply.status(401).send()
    }

    return memory
  })

  app.post('/memories', async (request) =>{
    const bodySchema = z.object({
      content: z.string(),
      coverurl: z.string(),
      isPublic: z.coerce.boolean().default(false),
    })

    const { content, coverurl, isPublic } = bodySchema.parse(request.body)

    const memory = await prisma.memory.create({
      data: {
        content,
        coverurl,
        isPublic,
        userId: '7b98e97f-b05f-4d27-b744-e254f941fed5',
      },

    })

    return memory
  })

  app.put('/memories/:id', async (request, reply) =>{
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const bodySchema = z.object({
      content: z.string(),
      coverurl: z.string(),
      isPublic: z.coerce.boolean().default(false),
    })

    const { content, coverurl, isPublic } = bodySchema.parse(request.body)

    let memory = await prisma.memory.findUniqueOrThrow({
      where: {
        id,
      }
    })

    if(memory.userId != request.user.sub) {
      return reply.status(401).send()
    }

    memory = await prisma.memory.update({
      where:{
        id,
      },
      data: {
        content,
        coverurl,
        isPublic,
      }
    })

    return memory
  })

  app.delete('/memories/:id', async (request, reply) =>{
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const memory = await prisma.memory.findUniqueOrThrow({
      where: {
        id,
      }
    })

    if(memory.userId != request.user.sub) {
      return reply.status(401).send()
    }

   await prisma.memory.delete({
      where: {
        id,
      }
    })
  })
}
