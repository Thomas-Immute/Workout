import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ChevronDown, Trophy, LineChart, Dumbbell } from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const EXERCISE_TEMPLATES = {
  'Push Day': ['Bench Press', 'Overhead Press', 'Tricep Extensions', 'Lateral Raises'],
  'Pull Day': ['Pull-ups', 'Barbell Rows', 'Bicep Curls', 'Face Pulls'],
  'Leg Day': ['Squats', 'Deadlifts', 'Leg Press', 'Calf Raises'],
  'Full Body': ['Squats', 'Bench Press', 'Rows', 'Shoulder Press']
};

const ExerciseTracker = () => {
  // State management
  const [workouts, setWorkouts] = useState(() => {
    const saved = localStorage.getItem('workouts');
    return saved ? JSON.parse(saved) : [];
  });

  const [personalRecords, setPersonalRecords] = useState(() => {
    const saved = localStorage.getItem('prs');
    return saved ? JSON.parse(saved) : {};
  });

  const [currentExercise, setCurrentExercise] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [activeTab, setActiveTab] = useState('log'); // 'log', 'charts', 'records'
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Effects
  useEffect(() => {
    localStorage.setItem('workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem('prs', JSON.stringify(personalRecords));
  }, [personalRecords]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Helper functions
  const addExercise = () => {
    if (currentExercise && currentWeight && currentReps) {
      const newWorkout = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        exercise: currentExercise,
        weight: parseFloat(currentWeight),
        reps: parseInt(currentReps)
      };

      // Check and update PR if necessary
      const exercisePR = personalRecords[currentExercise] || { weight: 0, reps: 0 };
      if (newWorkout.weight > exercisePR.weight) {
        setPersonalRecords(prev => ({
          ...prev,
          [currentExercise]: { weight: newWorkout.weight, reps: newWorkout.reps }
        }));
      }

      setWorkouts([newWorkout, ...workouts]);
      setCurrentExercise('');
      setCurrentWeight('');
      setCurrentReps('');
    }
  };

  const loadTemplate = (template) => {
    setSelectedTemplate(template);
    setCurrentExercise(EXERCISE_TEMPLATES[template][0]);
  };

  const getExerciseData = (exerciseName) => {
    return workouts
      .filter(w => w.exercise === exerciseName)
      .map(w => ({ date: w.date, weight: w.weight }))
      .reverse()
      .slice(-10); // Last 10 entries
  };

  const uniqueExercises = [...new Set(workouts.map(w => w.exercise))];

  // Render functions
  const renderLogTab = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select
          className="p-2 border rounded flex-1"
          value={selectedTemplate}
          onChange={(e) => loadTemplate(e.target.value)}
        >
          <option value="">Select Template</option>
          {Object.keys(EXERCISE_TEMPLATES).map(template => (
            <option key={template} value={template}>{template}</option>
          ))}
        </select>

        <input
          type="text"
          list="exercises"
          placeholder="Exercise name"
          value={currentExercise}
          onChange={(e) => setCurrentExercise(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <datalist id="exercises">
          {uniqueExercises.map(exercise => (
            <option key={exercise} value={exercise} />
          ))}
        </datalist>

        <input
          type="number"
          placeholder="Weight (lbs)"
          value={currentWeight}
          onChange={(e) => setCurrentWeight(e.target.value)}
          className="w-32 p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Reps"
          value={currentReps}
          onChange={(e) => setCurrentReps(e.target.value)}
          className="w-24 p-2 border rounded"
        />

        <button
          onClick={addExercise}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="space-y-2">
        {workouts.map((workout) => (
          <div key={workout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex-1 grid grid-cols-4 gap-4">
              <span className="text-gray-500">{workout.date}</span>
              <span className="font-medium">{workout.exercise}</span>
              <span>{workout.weight} lbs</span>
              <span>{workout.reps} reps</span>
            </div>
            {personalRecords[workout.exercise]?.weight === workout.weight && (
              <Trophy className="text-yellow-500 mr-2" size={16} />
            )}
            <button
              onClick={() => setWorkouts(workouts.filter(w => w.id !== workout.id))}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChartsTab = () => (
    <div className="space-y-4">
      {uniqueExercises.map(exercise => {
        const data = getExerciseData(exercise);
        return (
          <Card key={exercise} className="p-4">
            <CardTitle className="mb-4">{exercise} Progress</CardTitle>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={data}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#3b82f6" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const renderRecordsTab = () => (
    <div className="space-y-2">
      {Object.entries(personalRecords).map(([exercise, record]) => (
        <div key={exercise} className="p-4 bg-gray-50 rounded flex items-center justify-between">
          <div>
            <h3 className="font-medium">{exercise}</h3>
            <p className="text-gray-600">
              PR: {record.weight} lbs × {record.reps} reps
            </p>
          </div>
          <Trophy className="text-yellow-500" size={20} />
        </div>
      ))}
    </div>
  );

  // Main render
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Exercise Tracker
            <span className={`text-sm ${isOnline ? 'text-green-500' : 'text-gray-500'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab('log')}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                activeTab === 'log' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              <Dumbbell size={16} /> Log
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                activeTab === 'charts' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              <LineChart size={16} /> Progress
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                activeTab === 'records' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              <Trophy size={16} /> Records
            </button>
          </div>

          {activeTab === 'log' && renderLogTab()}
          {activeTab === 'charts' && renderChartsTab()}
          {activeTab === 'records' && renderRecordsTab()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExerciseTracker;
