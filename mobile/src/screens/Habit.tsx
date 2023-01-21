import { ScrollView, Text, View } from "react-native"
import { useRoute } from "@react-navigation/native";
import { BackButton } from "../components/BackButton";
import dayjs from "dayjs";
import { ProgressBar } from "../components/ProgressBar";
import { Checkbox } from "../components/Checkbox";

interface Params {
    date: string
}

export const Habit = () => {
    const route = useRoute()
    const { date } = route.params as Params

    const parsedDate = dayjs(date)
    const dayOfWeek = parsedDate.format('dddd')
    const dayAndMonth = parsedDate.format('DD/MM')

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

                <ProgressBar progress={25} />

                <View className="mt-6">
                    <Checkbox
                        title="Beber água"
                        checked={false}
                    />
                    <Checkbox
                        title="Correr"
                        checked
                    />
                </View>

            </ScrollView>
        </View>
    )
}