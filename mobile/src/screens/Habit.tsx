import { Alert, ScrollView, Text, View } from "react-native"
import { useRoute } from "@react-navigation/native";
import { BackButton } from "../components/BackButton";
import dayjs from "dayjs";
import { ProgressBar } from "../components/ProgressBar";
import { Checkbox } from "../components/Checkbox";
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import { api } from "../lib/axios";
import { generateProgressPercentage } from "../utils/generate-progress-percentage";
import { HabitsEmpty } from "../components/HabitsEmpty";
import clsx from "clsx";

interface Params {
    date: string
}

interface DayInfoProps {
    completedHabits: string[]
    possibleHabits: {
        id: string
        title: string
    }[]
}

export const Habit = () => {
    const [loading, setLoading] = useState(true)
    const [dayInfo, setDayInfo] = useState<DayInfoProps | null>(null)
    const [completedHabits, setCompletedHabits] = useState<string[]>([])
    const route = useRoute()
    const { date } = route.params as Params

    const parsedDate = dayjs(date)
    const isPast = parsedDate.endOf('day').isBefore(new Date())
    const dayOfWeek = parsedDate.format('dddd')
    const dayAndMonth = parsedDate.format('DD/MM')

    const habitProgress = dayInfo?.possibleHabits.length ? generateProgressPercentage(dayInfo.possibleHabits.length, completedHabits.length) : 0

    const fetchHabits = async () => {
        try {
            setLoading(true)

            const response = await api.get('/day', {
                params: { date }
            })

            setDayInfo(response.data)
            setCompletedHabits(response.data.completedHabits)

        } catch (error) {
            console.log(error)
            Alert.alert('Ops', 'Não foi possível carregar as informações do hábito!')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleHabit = async (habitId: string) => {


        try {
            await api.patch(`/habits/${habitId}/toggle`)

            if (completedHabits.includes(habitId)) {
                setCompletedHabits(prevState => prevState.filter(habit => habit !== habitId))
            } else {
                setCompletedHabits(prevState => [...prevState, habitId])
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Ops', 'Não foi possível mudar o status do hábito!')

        }
    }

    useEffect(() => {
        fetchHabits()
    }, [])


    if (loading) return <Loading />

    return (
        <View className="flex-1 bg-background px-8 pt-16">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 25 }}
            >
                <BackButton />

                <Text className="text-zinc-400 mt-6 font-semibold text-base lowercase">
                    {dayOfWeek}
                </Text>

                <Text className="text-white mt-6 font-extrabold text-3xl lowercase">
                    {dayAndMonth}
                </Text>

                <ProgressBar progress={habitProgress} />

                <View className={clsx("mt-6", {
                    ['opacity-50']: isPast
                })}>
                    {
                        dayInfo?.possibleHabits ?
                            dayInfo?.possibleHabits.map(habit => {

                                return (
                                    <Checkbox
                                        key={habit.id}
                                        title={habit.title}
                                        checked={completedHabits.includes(habit.id)}
                                        disabled={isPast}
                                        onPress={() => handleToggleHabit(habit.id)}
                                    />
                                )
                            })
                            :
                            <HabitsEmpty />
                    }
                </View>

                {
                    isPast && (<Text className="text-white mt-10 text-center">
                        Você não pode editar habitos em datas passadas!
                    </Text>)
                }

            </ScrollView>
        </View>
    )
}