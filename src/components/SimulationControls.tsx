import React from 'react';
import { Play, Pause, RotateCcw, User } from 'lucide-react';
import { PersonalFinancialData, SimulationProgress } from '../types/simulation';

interface SimulationControlsProps {
  hasStarted: boolean;
  simulationState: 'setup' | 'running' | 'paused' | 'completed';
  simulationProgress: SimulationProgress;
  personalData: PersonalFinancialData;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onEditProfile: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  hasStarted,
  simulationState,
  simulationProgress,
  personalData,
  onStart,
  onPause,
  onReset,
  onEditProfile
}) => {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Simulation Controls */}
          <div className="flex items-center space-x-4">
            {/* Start/Resume/Pause Button */}
              {!hasStarted ? (
                <button
                  onClick={onStart}
                  className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Simulation
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  {simulationState === 'running' ? (
                    <button
                      onClick={onPause}
                      className="flex items-center bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={onStart}
                      className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </button>
                  )}
                </div>
              )}

              {/* Reset Button */}
              <button
                onClick={onReset}
                className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </button>

            {/* Edit Profile Button */}
            <button
              onClick={onEditProfile}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          </div>

          {/* Right side - Simulation Progress */}
          {hasStarted && (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-800">{simulationProgress.currentAge}</div>
                  <div className="text-xs text-gray-600">Age</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800">{simulationProgress.yearsElapsed}</div>
                  <div className="text-xs text-gray-600">Years</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800">{Math.max(0, personalData.retirementAge - simulationProgress.currentAge)}</div>
                  <div className="text-xs text-gray-600">To Retire</div>
                </div>
                <div className="text-center">
                  <div className={`font-semibold capitalize ${
                    simulationState === 'running' ? 'text-green-600' : 
                    simulationState === 'paused' ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {simulationState}
                  </div>
                  <div className="text-xs text-gray-600">Status</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
