import assert from 'node:assert/strict';import{secondaryMotion}from'./secondary-motion.mjs';
for(const kind of ['idle','coconut','run','depart'])for(let t=0;t<30;t+=.125){const p=secondaryMotion(kind,t,[t*.02,.4],[t*.02-.025,.4]);for(const value of Object.values(p))assert.ok(value===null||Number.isFinite(value),kind+':'+t)}
assert.equal(secondaryMotion('idle',15,[0,0],[0,0]).lift,0);
assert.ok(secondaryMotion('coconut',20,[0,0],[0,0]).impact>0);
console.log('Secondary motion tests passed');