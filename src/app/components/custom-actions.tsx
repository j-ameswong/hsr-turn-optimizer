import { useState } from 'react';
import { useDrag } from 'react-dnd';
import { GripVertical, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface CustomAction {
  id: string;
  name: string;
  actionAdvance: number;
  speedBoost: number;
}

interface DraggableActionProps {
  action: CustomAction;
  onDelete?: (id: string) => void;
  isDefault?: boolean;
}

function DraggableAction({ action, onDelete, isDefault = false }: DraggableActionProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ACTION',
    item: { action },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`border-2 border-black bg-white p-2 cursor-move transition-opacity ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <GripVertical className="w-3 h-3" />
          <span className="font-mono text-xs font-bold">{action.name}</span>
        </div>
        {!isDefault && onDelete && (
          <button
            onClick={() => onDelete(action.id)}
            className="hover:bg-gray-200 p-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      {(action.actionAdvance > 0 || action.speedBoost > 0) && (
        <div className="font-mono text-xs text-gray-600">
          {action.actionAdvance > 0 && <div>ADV: +{action.actionAdvance}%</div>}
          {action.speedBoost > 0 && <div>SPD: +{action.speedBoost}%</div>}
        </div>
      )}
    </div>
  );
}

export function CustomActions() {
  const [actions, setActions] = useState<CustomAction[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showActionsSection, setShowActionsSection] = useState(true);
  const [newAction, setNewAction] = useState({
    name: '',
    actionAdvance: 0,
    speedBoost: 0,
  });

  const defaultActions: CustomAction[] = [
    { id: 'basic', name: 'Basic', actionAdvance: 0, speedBoost: 0 },
    { id: 'skill', name: 'Skill', actionAdvance: 0, speedBoost: 0 },
    { id: 'ultimate', name: 'Ultimate', actionAdvance: 0, speedBoost: 0 },
  ];

  const handleAddAction = () => {
    if (!newAction.name) return;
    
    const action: CustomAction = {
      id: Math.random().toString(36).substr(2, 9),
      ...newAction,
    };
    
    setActions([...actions, action]);
    setNewAction({ name: '', actionAdvance: 0, speedBoost: 0 });
    setShowAddForm(false);
  };

  const handleDeleteAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
  };

  return (
    <div className="border-2 border-black bg-gray-50 flex flex-col overflow-hidden h-full">
      <div className="border-b-2 border-black bg-white px-3 py-2 flex-shrink-0">
        <h2 className="font-mono font-bold text-sm">CUSTOM ACTIONS</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Default Actions Section */}
        <div className="border-2 border-black bg-white">
          <button
            onClick={() => setShowActionsSection(!showActionsSection)}
            className="w-full px-2 py-1 bg-black text-white font-mono text-xs flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <span>ACTIONS</span>
            {showActionsSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showActionsSection && (
            <div className="p-2 space-y-2">
              {defaultActions.map(action => (
                <DraggableAction
                  key={action.id}
                  action={action}
                  isDefault={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="border-2 border-black bg-white p-3">
            <div className="space-y-2">
              <div>
                <label className="font-mono text-xs block mb-1">NAME</label>
                <input
                  type="text"
                  value={newAction.name}
                  onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
                  className="w-full border border-black px-2 py-1 font-mono text-xs"
                  placeholder="Action name..."
                />
              </div>
              <div>
                <label className="font-mono text-xs block mb-1">ACTION ADVANCE %</label>
                <input
                  type="number"
                  value={newAction.actionAdvance}
                  onChange={(e) => setNewAction({ ...newAction, actionAdvance: parseInt(e.target.value) || 0 })}
                  className="w-full border border-black px-2 py-1 font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-mono text-xs block mb-1">SPEED BOOST %</label>
                <input
                  type="number"
                  value={newAction.speedBoost}
                  onChange={(e) => setNewAction({ ...newAction, speedBoost: parseInt(e.target.value) || 0 })}
                  className="w-full border border-black px-2 py-1 font-mono text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddAction}
                  className="flex-1 px-3 py-1 bg-black text-white border-2 border-black font-mono text-xs hover:bg-white hover:text-black transition-colors"
                >
                  ADD
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-3 py-1 bg-white border-2 border-black font-mono text-xs hover:bg-black hover:text-white transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Action List */}
        {actions.length > 0 && (
          <div className="space-y-2">
            {actions.map(action => (
              <DraggableAction
                key={action.id}
                action={action}
                onDelete={handleDeleteAction}
              />
            ))}
          </div>
        )}

        {/* Add Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full px-3 py-2 bg-white border-2 border-black font-mono text-xs hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            ADD CUSTOM ACTION
          </button>
        )}
      </div>

      <div className="border-t-2 border-black bg-white px-3 py-2 flex-shrink-0">
        <p className="font-mono text-xs text-gray-600">
          DRAG TO TIMELINE
        </p>
      </div>
    </div>
  );
}