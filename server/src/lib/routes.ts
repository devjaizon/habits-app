import { prisma } from './prisma'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import dayjs from 'dayjs'

export const appRoutes = async (app: FastifyInstance) => {
    // add a habit specifying in which days it is avaliable
    app.post('/habits', async (request) => {
        const createHabitBody = z.object({
            title: z.string(),
            weekDays: z.array(z.number().min(0).max(6)),
        })

        const { title, weekDays } = createHabitBody.parse(request.body)

        const today = dayjs().startOf('day').toDate()

        await prisma.habit.create({
            data: {
                title,
                created_at: today,
                weekDays: {
                    create: weekDays.map((weekDay) => {
                        return {
                            week_day: weekDay,
                        }
                    }),
                },
            },
        })
    })

    // get habits on the day
    app.get('/day', async (request) => {
        const getDayParams = z.object({
            date: z.coerce.date(),
        })

        const { date } = getDayParams.parse(request.query)

        const parsedDate = dayjs(date).startOf('day')
        const weekDay = parsedDate.get('day')

        console.log(date, weekDay)

        // get all habits
        const possibleHabits = await prisma.habit.findMany({
            where: {
                created_at: {
                    lte: date,
                },
                weekDays: {
                    some: {
                        week_day: weekDay,
                    },
                },
            },
        })
        // get completed apps
        const day = await prisma.day.findUnique({
            where: {
                date: parsedDate.toDate(),
            },
            include: {
                dayHabits: true,
            },
        })

        const completedHabits = day?.dayHabits.map(
            (dayHabit) => dayHabit.habit_id
        )

        return {
            possibleHabits,
            completedHabits,
        }
    })

    // (dis)complete habit
    app.patch('/habits/:id/toggle', async (request) => {
        // route param
        const toggleHabitParams = z.object({
            id: z.string().uuid(),
        })

        const { id } = toggleHabitParams.parse(request.params)
        const today = dayjs().startOf('day').toDate()

        let day = await prisma.day.findUnique({
            where: {
                date: today,
            },
        })

        if (!day) {
            day = await prisma.day.create({
                data: {
                    date: today,
                },
            })
        }

        // check if day habit is checked
        const dayHabit = await prisma.dayhabit.findUnique({
            where: {
                day_id_habit_id: {
                    day_id: day.id,
                    habit_id: id,
                },
            },
        })

        if (dayHabit) {
            // remove check
            console.log(dayHabit)

            await prisma.dayhabit.delete({
                where: {
                    id: dayHabit.id,
                },
            })
        } else {
            // add check
            await prisma.dayhabit.create({
                data: {
                    day_id: day.id,
                    habit_id: id,
                },
            })
        }
    })

    app.get('/summary', async (request) => {
        // return array with many
        const summary = await prisma.$queryRaw`
            SELECT
                D.id, 
                D.date,
                (
                    SELECT cast(count(*) as float)
                    FROM day_habits DH
                    WHERE DH.day_id = D.id
                ) as completed,
                (
                    SELECT cast(count(*) as float)
                    FROM  habit_week_days HWD
                    JOIN habits H
                        ON H.id = HWD.habit_id
                    WHERE HWD.week_day = cast(strftime('%w', D.date / 1000.0, 'unixepoch') as int)
                    AND H.created_at <= D.date
                ) as amount
            FROM days D
        `
        return summary
    })
}