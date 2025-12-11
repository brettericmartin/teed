'use client';

import { useState } from 'react';
import { Check, X, Plus, AlertCircle, Eye } from 'lucide-react';
import type { DetectedObject } from '@/lib/apis/types';

interface ObjectValidationCheckpointProps {
  objects: DetectedObject[];
  onValidate: (
    selectedIds: string[],
    corrections?: string,
    addedObjects?: Partial<DetectedObject>[]
  ) => void;
  onCancel: () => void;
  sourceImages?: string[];  // For bulk mode - thumbnails of source images
}

export default function ObjectValidationCheckpoint({
  objects,
  onValidate,
  onCancel,
  sourceImages
}: ObjectValidationCheckpointProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    objects.filter(o => o.selected).map(o => o.id)
  );
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState('');
  const [showAddObject, setShowAddObject] = useState(false);
  const [newObjectType, setNewObjectType] = useState('');
  const [newObjectCategory, setNewObjectCategory] = useState('');
  const [addedObjects, setAddedObjects] = useState<Partial<DetectedObject>[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddObject = () => {
    if (!newObjectType.trim()) return;

    setAddedObjects(prev => [
      ...prev,
      {
        objectType: newObjectType.trim(),
        productCategory: newObjectCategory.trim() || 'other',
        visualCues: []
      }
    ]);
    setNewObjectType('');
    setNewObjectCategory('');
    setShowAddObject(false);
  };

  const removeAddedObject = (index: number) => {
    setAddedObjects(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    onValidate(
      selectedIds,
      correctionText.trim() || undefined,
      addedObjects.length > 0 ? addedObjects : undefined
    );
  };

  const totalSelected = selectedIds.length + addedObjects.length;

  const getCertaintyColor = (certainty: DetectedObject['certainty']) => {
    switch (certainty) {
      case 'definite':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'likely':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'uncertain':
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Review Detected Objects</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Select the items you want to identify. Uncheck any that are wrong.
        </p>
      </div>

      {/* Objects list */}
      <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
        {objects.map((obj) => (
          <button
            key={obj.id}
            onClick={() => toggleSelection(obj.id)}
            className={`
              w-full text-left p-3 rounded-lg border-2 transition-all
              ${selectedIds.includes(obj.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <div
                className={`
                  flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5
                  ${selectedIds.includes(obj.id)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                  }
                `}
              >
                {selectedIds.includes(obj.id) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>

              {/* Source image thumbnail (bulk mode) */}
              {sourceImages && obj.sourceImageIndex !== undefined && (
                <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden border border-gray-200">
                  <img
                    src={sourceImages[obj.sourceImageIndex]}
                    alt={`Image ${obj.sourceImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Object info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 capitalize">
                    {obj.objectType}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getCertaintyColor(obj.certainty)}`}>
                    {obj.certainty}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {obj.productCategory}
                  </span>
                  {sourceImages && obj.sourceImageIndex !== undefined && (
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Photo {obj.sourceImageIndex + 1}
                    </span>
                  )}
                </div>

                {/* Visual cues */}
                {obj.visualCues.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {obj.visualCues.slice(0, 3).map((cue, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded"
                      >
                        {cue}
                      </span>
                    ))}
                    {obj.visualCues.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{obj.visualCues.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Location */}
                <p className="text-xs text-gray-400 mt-1">
                  Location: {obj.boundingDescription}
                </p>
              </div>
            </div>
          </button>
        ))}

        {/* Added objects */}
        {addedObjects.map((obj, index) => (
          <div
            key={`added-${index}`}
            className="w-full p-3 rounded-lg border-2 border-emerald-500 bg-emerald-50"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center mt-0.5">
                <Plus className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 capitalize">
                    {obj.objectType}
                  </span>
                  <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                    Added by you
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeAddedObject(index)}
                className="p-1 hover:bg-red-100 rounded text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Correction section */}
      <div className="px-4 pb-4 space-y-3">
        {/* "That's wrong" button */}
        <button
          onClick={() => setShowCorrection(!showCorrection)}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
            ${showCorrection
              ? 'border-amber-300 bg-amber-50 text-amber-700'
              : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-600 hover:text-amber-700'
            }
          `}
        >
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {showCorrection ? "Tell us what's wrong" : "That's wrong / Missing something"}
          </span>
        </button>

        {showCorrection && (
          <div className="space-y-2">
            <textarea
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              placeholder="Describe what we got wrong or what we missed..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>
        )}

        {/* Add object section */}
        <button
          onClick={() => setShowAddObject(!showAddObject)}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
            ${showAddObject
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700'
            }
          `}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add an item I see</span>
        </button>

        {showAddObject && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newObjectType}
              onChange={(e) => setNewObjectType(e.target.value)}
              placeholder="What is it? (e.g., 'putter headcover')"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <select
              value={newObjectCategory}
              onChange={(e) => setNewObjectCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Category</option>
              <option value="golf">Golf</option>
              <option value="tech">Tech</option>
              <option value="fashion">Fashion</option>
              <option value="outdoor">Outdoor</option>
              <option value="other">Other</option>
            </select>
            <button
              onClick={handleAddObject}
              disabled={!newObjectType.trim()}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {totalSelected} item{totalSelected !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleContinue}
            disabled={totalSelected === 0}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Identify
          </button>
        </div>
      </div>
    </div>
  );
}
