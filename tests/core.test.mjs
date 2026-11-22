/* MIT */

import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {webcrypto} from 'node:crypto';
const {UUIDKit: U} = createRequire(import.meta.url)('../core.js');
const zeros = {getRandomValues: bytes => bytes.fill(0)}, ones = {getRandomValues: bytes => bytes.fill(255)};
for (const [text, expected] of [
 ['00000000-0000-4000-8000-000000000000', {version:4,variant:'RFC 9562',timestamp:null}],
 ['FFFFFFFF-FFFF-4FFF-BFFF-FFFFFFFFFFFF', {version:4,variant:'RFC 9562',timestamp:null}],
 ['00000000-0000-7000-8000-000000000000', {version:7,variant:'RFC 9562',timestamp:{milliseconds:0,utc:'1970-01-01T00:00:00.000Z',myt:'1970-01-01T08:00:00.000+08:00'}}],
 ['017f22e2-79b0-7cc3-98c4-dc0c0c07398f', {version:7,variant:'RFC 9562',timestamp:{milliseconds:1645557742000,utc:'2022-02-22T19:22:22.000Z',myt:'2022-02-23T03:22:22.000+08:00'}}]
]) test('UUID independent fixture '+text,()=>{const r=U.inspect(text);assert.equal(r.valid,true);for(const key of Object.keys(expected))assert.deepEqual(r[key],expected[key]);assert.equal(r.canonical,text.toLowerCase());});
for (let i=0;i<16;i++) test('UUID version nibble '+i,()=>{const r=U.inspect('00000000-0000-'+i.toString(16)+'000-8000-000000000000');assert.equal(r.version,i);assert.equal(r.valid,i===4||i===7);if(!r.valid)assert.match(r.error,/versions/);});
for (let i=0;i<16;i++) test('UUID variant nibble '+i,()=>{const r=U.inspect('00000000-0000-7000-'+i.toString(16)+'000-000000000000');assert.equal(r.variant,i<8?'NCS':i<12?'RFC 9562':i<14?'Microsoft':'Reserved');assert.equal(r.valid,i>=8&&i<12);assert.equal(r.timestamp!==null,i>=8&&i<12);});
for (const value of ['',null,14,{},'x'.repeat(129),'550e8400e29b41d4a716446655440000','{550e8400-e29b-41d4-a716-446655440000}','urn:uuid:550e8400-e29b-41d4-a716-446655440000','550e8400-e29b-41d4-a716-44665544000g','550e8400-e29b-41d4-a716-446655440000\0','<img src=x onerror=alert(1)>']) test('invalid UUID/ULID '+JSON.stringify(value),()=>assert.equal(U.inspect(value).valid,false));
for (const [value, ms] of [['00000000000000000000000000',0],['00000000010000000000000000',1],['00000000Z80000000000000000',1000],['7ZZZZZZZZZZZZZZZZZZZZZZZZZ',281474976710655]]) test('ULID independent timestamp '+value,()=>{const r=U.inspect(value);assert.equal(r.valid,true);assert.equal(r.timestamp.milliseconds,ms);assert.equal(r.type,'ULID');assert.equal(r.version,null);assert.equal(r.variant,null);});
for (const c of ['I','L','O','U','i','l','o','u','-','!',' ']) test('ULID alphabet rejection '+c,()=>assert.equal(U.inspect('0000000000'+c+'00000000000000').valid,false));
for (const c of '89ABCDEFGHJKMNPQRSTVWXYZ') test('ULID 130-bit overflow '+c,()=>assert.match(U.inspect(c+'Z'.repeat(25)).error,/overflow/));
test('case and surrounding whitespace',()=>{assert.equal(U.inspect(' \t550E8400-E29B-41D4-A716-446655440000\n').valid,true);assert.equal(U.inspect('01arz3ndektsv4rrffq69g5fav').canonical,'01ARZ3NDEKTSV4RRFFQ69G5FAV');});
test('MYT day rollover',()=>{const id=U.generate('v7',1,57600000,zeros)[0];assert.equal(U.inspect(id).timestamp.myt,'1970-01-02T00:00:00.000+08:00');});
test('batch lines, blanks, aggregate validity',()=>{const r=U.inspectBatch('\n00000000-0000-4000-8000-000000000000\r\n\nwrong\n');assert.equal(r.count,2);assert.equal(r.validCount,1);assert.equal(r.valid,false);assert.deepEqual(r.entries.map(e=>e.line),[2,4]);assert.equal(U.inspectBatch(' \n\t').valid,false);});
test('batch resource bounds',()=>{assert.equal(U.inspectBatch('\n'.repeat(999)).count,0);assert.throws(()=>U.inspectBatch('\n'.repeat(1000)),/limit/);assert.equal(U.inspectBatch(' '.repeat(131072)).count,0);assert.throws(()=>U.inspectBatch(' '.repeat(131073)),/limit/);assert.throws(()=>U.inspectBatch(null),/limit/);});
for (const [type, rng, expected] of [
 ['v4',zeros,'00000000-0000-4000-8000-000000000000'],['v4',ones,'ffffffff-ffff-4fff-bfff-ffffffffffff'],
 ['v7',zeros,'00000000-0000-7000-8000-000000000000'],['v7',ones,'00000000-0000-7fff-bfff-ffffffffffff'],
 ['ulid',zeros,'00000000000000000000000000'],['ulid',ones,'0000000000ZZZZZZZZZZZZZZZZ']
]) test('exact byte mask and random capacity '+type+expected,()=>assert.deepEqual(U.generate(type,1,0,rng),[expected]));
for (const type of ['v7','ulid']) for (const ms of [-1,0.5,NaN,Infinity,'1',null,281474976710656,Number.MAX_SAFE_INTEGER]) test('timestamp rejection '+type+String(ms),()=>assert.throws(()=>U.generate(type,1,ms,zeros),/Timestamp/));
for (const count of [0,-1,0.5,1001,'2',NaN,Infinity,null]) test('count rejection '+String(count),()=>assert.throws(()=>U.generate('v4',count,0,zeros),/count/));
test('unknown type rejected',()=>assert.throws(()=>U.generate('v1',1,0,zeros),/Choose/));
for(const rng of [undefined,null,{}, {getRandomValues:1}]) test('no insecure fallback '+String(rng),()=>{if(rng===undefined)return assert.throws(()=>U.generate('v4',1,0,{}),/Web Crypto/);assert.throws(()=>U.generate('v4',1,0,rng),/Web Crypto/);});
test('crypto failures propagate',()=>assert.throws(()=>U.generate('v4',1,0,{getRandomValues(){throw Error('entropy unavailable');}}),/entropy unavailable/));
test('v4 ignores timestamp',()=>assert.equal(U.generate('v4',1,NaN,zeros)[0],'00000000-0000-4000-8000-000000000000'));
for(let i=0;i<80;i++) test('independent timestamp and random bytes fixture '+i,()=>{
 const ms=i===79?281474976710655:1645557742000+i*1000003;
 for(const type of ['v7','ulid']){
  const id=U.generate(type,1,ms,ones)[0],r=U.inspect(id);assert.equal(r.valid,true);assert.equal(r.timestamp.milliseconds,ms);
  if(type==='v7'){const b=Buffer.from(id.replaceAll('-',''),'hex');assert.equal(Number(b.readUIntBE(0,6)),ms);assert.equal(b[6],127);assert.equal(b[8],191);assert.equal(b.subarray(9).toString('hex'),'ffffffffffffff');}
  else {const chars='0123456789ABCDEFGHJKMNPQRSTVWXYZ';let n=0n;for(const c of id)n=n*32n+BigInt(chars.indexOf(c));assert.equal(n>>80n,BigInt(ms));assert.equal(n&((1n<<80n)-1n),(1n<<80n)-1n);}
 }
});
for(const type of ['v4','v7','ulid']) test('Web Crypto 1000-item batch '+type,()=>{const ids=U.generate(type,1000,1700000000123,webcrypto);assert.equal(ids.length,1000);assert.equal(new Set(ids).size,1000);assert.ok(ids.every(s=>U.inspect(s).valid));if(type!=='v4')assert.ok(ids.every(s=>U.inspect(s).timestamp.milliseconds===1700000000123));});
