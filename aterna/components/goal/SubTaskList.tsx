import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

interface SubTaskListProps {
  tasks: string[];
  completed: boolean[];
  onToggle: (index: number) => void;
}

export function SubTaskList({ tasks, completed, onToggle }: SubTaskListProps) {
  return (
    <View style={styles.container}>
      {tasks.map((task, index) => (
        <Pressable
          key={task}
          onPress={() => onToggle(index)}
          style={styles.row}
        >
          <View
            style={[
              styles.checkbox,
              completed[index] && styles.checkboxChecked,
            ]}
          />
          <Text
            style={[
              styles.task,
              completed[index] && styles.taskCompleted,
            ]}
          >
            {task}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  checkboxChecked: {
    backgroundColor: colors.accent.default,
    borderColor: colors.accent.default,
  },
  task: {
    fontSize: 15,
    color: colors.text.primary,
    flex: 1,
  },
  taskCompleted: {
    textDecorationLine: "line-through",
    color: colors.text.tertiary,
  },
});
