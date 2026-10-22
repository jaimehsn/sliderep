import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Exercise, getExercises } from '@/db/exercises';

export function useExercises() {
  const db = useSQLiteContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getExercises(db).then((rows) => {
      setExercises(rows);
      setLoaded(true);
    });
  }, [db]);

  return { exercises, loaded };
}
