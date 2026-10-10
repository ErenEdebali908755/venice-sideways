import test from 'node:test';
import assert from 'node:assert/strict';
import {distanceLabel,rangeLabel,dateLabel,stopCountLabel} from '../public/field-guide/formatting.js';
test('Russian stop counts use one, few and many, including teen exceptions',()=>{
 for(const [count,word] of [[1,'остановка'],[2,'остановки'],[5,'остановок'],[11,'остановок'],[21,'остановка'],[22,'остановки'],[28,'остановок']])assert.equal(stopCountLabel(count,'ru'),`${count} ${word}`);
 assert.equal(stopCountLabel(1,'en'),'1 stop');assert.equal(stopCountLabel(10,'en'),'10 stops');
});
test('quantities and dates follow the selected locale without changing their values',()=>{
 assert.match(distanceLabel(4.6,'tr'),/4,6/);assert.match(distanceLabel(4.6,'en'),/4\.6/);
 assert.match(distanceLabel(127.6,'ru','meter'),/128.*м/);
 assert.match(rangeLabel(4,4.5,'fr'),/4,5/);
 for(const lang of ['en','tr','it','fr','ru','zh','ja','ko']){
  assert.ok(dateLabel('2026-10-11',lang));assert.ok(rangeLabel(3,4,lang));assert.ok(distanceLabel(4.6,lang));
 }
 assert.match(dateLabel('2026-10-11','tr'),/11 Ekim 2026/);
 assert.equal(dateLabel('not-a-date','en'),'');
});
