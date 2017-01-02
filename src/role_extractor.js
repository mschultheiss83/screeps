'use strict';

/*
 * extractor gets minerals from the extractor
 *
 * Moves, harvest, brings to the terminal
 */

roles.extractor = {};
roles.extractor.stayInRoom = true;
roles.extractor.buildRoad = true;
roles.extractor.boostActions = ['harvest', 'capacity'];

roles.extractor.getPartConfig = function(room, energy, heal) {
  // default was:
  //var parts = [MOVE, CARRY, MOVE, WORK];
  // but move less, work harder!
  var parts = [MOVE, CARRY, WORK, WORK];
  return room.getPartConfig(energy, parts);
};

roles.extractor.energyBuild = function(room, energy, heal) {
  var max = 2000;
  energy = Math.max(250, Math.min(max, room.getEnergyCapacityAvailable()));
  return energy;
};

roles.extractor.terminalToStorageExchange = function(creep) {
  var terminal = creep.room.terminal;
  /**
   * The isActive() method is somehow expensive, could be fine for just the mineral roles
   * see https://github.com/TooAngel/screeps/pull/69
   * !terminal.isActive() is added if you loose RCL (Room Controller Level) somehow
   * :-) should not happen !
   */
  if (!terminal
  //|| !terminal.isActive()
  ) {
    creep.suicide();
    return ERR_INVALID_TARGET;
  }
  var energyInTerminal = terminal.store.energy / terminal.storeCapacity;
  var totalInTerminal = _.sum(terminal.store) / terminal.storeCapacity;
  if ((energyInTerminal < 0.5) && (totalInTerminal !== 1)) {
    return ERR_NOT_ENOUGH_RESOURCES;
  }

  if (totalInTerminal > 0.5) {
    // TODO call carry to move energy from
  }
  // transferToStructures then decide go to terminal or storage
  creep.transferToStructures();
  creep.construct();
  // creep.pickupEnergy();

  var action = {
    withdraw: _.sum(creep.carry) / creep.carryCapacity < 0.8,
    transfer: _.sum(creep.carry) / creep.carryCapacity > 0.3
  };
  var movingOptions = {
    //noPathFinding: true,
    reusePath: 1500
  };
  // TODO create new shortest path and use it
  // TODO replace creep.moveTo by creep.moveByPath
  // @see @link http://support.screeps.com/hc/en-us/articles/203013212-Creep#moveByPath
  if (action.withdraw) {
    if (creep.withdraw(terminal, RESOURCE_ENERGY) !== OK) {
      if (creep.moveTo(terminal, movingOptions) === ERR_NOT_FOUND) {
        console.log('create new path for the terminalStorageExchange feature');
      }
    }
  }

  if (!action.withdraw || action.transfer) {
    if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) !== OK) {
      if (creep.moveTo(creep.room.storage, movingOptions) === ERR_NOT_FOUND) {
        console.log('create new path for the terminalStorageExchange feature');
      }
    }
  }
  if (!action.withdraw && !action.transfer) {
    return ERR_NOT_FOUND;
  }

  return OK;
};

function executeExtractor(creep) {
  let energyInStorage = creep.room.terminal.store.energy / creep.room.terminal.storeCapacity;
  let returnValue = null;
  // TODO FIXME this is real ugly, but works move energy to storage for 5000 ticks, then extracts
  // TODO result of FIXME carry creeps from neighbour rooms transfer to extractor
  var limit = (Math.round(Game.time / 1000) % 10000 < 5) ? 0.6 : 0.5;
  if (energyInStorage > limit) {
    returnValue = roles.extractor.terminalToStorageExchange(creep);
  }
  if (returnValue === OK) {
    return true;
  } else {
    //creep.log('terminalToStorageExchange ' + returnValue);
    return creep.handleExractor();
  }
}

roles.extractor.action = executeExtractor;

roles.extractor.execute = executeExtractor;
