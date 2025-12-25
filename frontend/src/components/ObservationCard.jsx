import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronUp, Trash2, Check, X } from 'lucide-react';

const ObservationCard = ({ observation, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(observation.state === 'draft');
  const [localNote, setLocalNote] = useState(observation.note || '');

  const tagCategories = {
    sight: ['smoke', 'fluid_leak', 'warning_lights', 'loose_part', 'damage_visible', 'other'],
    sound: ['knocking', 'grinding', 'squealing', 'clicking', 'humming', 'thumping', 'other'],
    smell: ['exhaust_fumes', 'fuel', 'burning_oil', 'electrical_plastic', 'sweet_coolant', 'sulfur_rotten_egg', 'brakes_hot', 'other'],
    behavior: ['wont_start', 'stalls', 'loses_power', 'intermittent_operation', 'component_stopped_working', 'overheating_signs', 'hard_shift', 'other']
  };

  const frequencies = ['once', 'few_times', 'frequent'];
  const trends = ['random', 'getting_worse', 'getting_better', 'unchanged'];

  const toggleTag = (tag) => {
    const newTags = observation.tags.includes(tag)
      ? observation.tags.filter(t => t !== tag)
      : [...observation.tags, tag];
    onUpdate(observation.id, { tags: newTags });
  };

  const handleSaveNote = () => {
    onUpdate(observation.id, { note: localNote });
  };

  const handleActivate = () => {
    onUpdate(observation.id, { state: 'active' });
    setIsExpanded(false);
  };

  const handleResolve = () => {
    onUpdate(observation.id, { state: 'resolved' });
    setIsExpanded(false);
  };

  const handleReactivate = () => {
    onUpdate(observation.id, { state: 'active' });
  };

  const getStateColor = () => {
    switch (observation.state) {
      case 'active':
        return 'border-green-300 bg-green-50';
      case 'draft':
        return 'border-slate-300 bg-white';
      case 'resolved':
        return 'border-slate-200 bg-slate-50 opacity-75';
      default:
        return 'border-slate-300 bg-white';
    }
  };

  return (
    <div className={`rounded-lg border-2 ${getStateColor()} overflow-hidden`}>
      {/* Header */}
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          {observation.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {observation.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag.replace(/_/g, ' ')}
                </Badge>
              ))}
              {observation.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">+{observation.tags.length - 3}</Badge>
              )}
            </div>
          ) : (
            <span className="text-sm text-slate-500">New observation</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={observation.state === 'active' ? 'default' : 'outline'} className="text-xs">
            {observation.state}
          </Badge>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-200 space-y-4">
          {/* Tag Categories */}
          {Object.entries(tagCategories).map(([category, tags]) => (
            <div key={category}>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 block">
                {category}
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      observation.tags.includes(tag)
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tag.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Frequency */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 block">
              Frequency
            </label>
            <div className="flex gap-2">
              {frequencies.map(freq => (
                <button
                  key={freq}
                  onClick={() => onUpdate(observation.id, { frequency: freq })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    observation.frequency === freq
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {freq.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Trend */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 block">
              Trend
            </label>
            <div className="flex gap-2">
              {trends.map(trend => (
                <button
                  key={trend}
                  onClick={() => onUpdate(observation.id, { trend })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    observation.trend === trend
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {trend.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 block">
              Note (optional, max 220 chars)
            </label>
            <Textarea
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value.slice(0, 220))}
              onBlur={handleSaveNote}
              placeholder="Any additional details..."
              className="text-sm"
              rows={3}
            />
            <p className="text-xs text-slate-500 mt-1">{localNote.length}/220</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {observation.state === 'draft' && (
              <Button
                onClick={handleActivate}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-1" />
                Activate
              </Button>
            )}
            {observation.state === 'active' && (
              <Button
                onClick={handleResolve}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Mark Resolved
              </Button>
            )}
            {observation.state === 'resolved' && (
              <Button
                onClick={handleReactivate}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Reactivate
              </Button>
            )}
            <Button
              onClick={() => onDelete(observation.id)}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObservationCard;
