import React, { useState } from 'react';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import ObservationCard from './ObservationCard';

const ObservationsPanel = ({ observations, setObservations }) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = () => {
    const newObservation = {
      id: Date.now().toString(),
      state: 'draft',
      tags: [],
      smellSource: null,
      hvacFactors: [],
      conditions: [],
      frequency: null,
      trend: null,
      timeContext: null,
      note: ''
    };
    setObservations([...observations, newObservation]);
    setIsCreating(true);
  };

  const handleUpdateObservation = (id, updates) => {
    setObservations(observations.map(obs => 
      obs.id === id ? { ...obs, ...updates } : obs
    ));
  };

  const handleDeleteObservation = (id) => {
    setObservations(observations.filter(obs => obs.id !== id));
  };

  const activeObservations = observations.filter(o => o.state === 'active');
  const draftObservations = observations.filter(o => o.state === 'draft');
  const resolvedObservations = observations.filter(o => o.state === 'resolved');

  return (
    <div className="p-4 space-y-4">
      {/* Active Observations */}
      {activeObservations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Active</h3>
          {activeObservations.map(obs => (
            <ObservationCard
              key={obs.id}
              observation={obs}
              onUpdate={handleUpdateObservation}
              onDelete={handleDeleteObservation}
            />
          ))}
        </div>
      )}

      {/* Draft Observations */}
      {draftObservations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Draft</h3>
          {draftObservations.map(obs => (
            <ObservationCard
              key={obs.id}
              observation={obs}
              onUpdate={handleUpdateObservation}
              onDelete={handleDeleteObservation}
            />
          ))}
        </div>
      )}

      {/* Resolved Observations */}
      {resolvedObservations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Resolved</h3>
          {resolvedObservations.map(obs => (
            <ObservationCard
              key={obs.id}
              observation={obs}
              onUpdate={handleUpdateObservation}
              onDelete={handleDeleteObservation}
            />
          ))}
        </div>
      )}

      {/* Add New Button */}
      {!isCreating && (
        <Button
          onClick={handleCreateNew}
          variant="outline"
          size="lg"
          className="w-full h-12 border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Observation
        </Button>
      )}

      {observations.length === 0 && !isCreating && (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">No observations yet.</p>
          <p className="text-xs mt-1">Add what you've noticed to improve accuracy.</p>
        </div>
      )}
    </div>
  );
};

export default ObservationsPanel;
