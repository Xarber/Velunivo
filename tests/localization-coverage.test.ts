import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {translate} from '../src/i18n/core';
const properNamesAndUnits=new Set(['#F6FAFC','2-digit','Apple Maps','Google Maps','MPH','Velunivo','XXXX-XXXX','rad/s','Bluetooth','English','Hardware','· Hardware','Demo · ','@start','{place}']); // Internal return-location ID and named interpolation token are not displayed.
test('UI literals and user-facing error messages have Italian translations',()=>{
 const messages=new Set<string>();
 const props=['title','description','detail','label','message','placeholder','accessibilityLabel','text','limitations'];
 const walk=(dir:string)=>{for(const file of fs.readdirSync(dir)){const name=path.join(dir,file);if(fs.statSync(name).isDirectory())walk(name);else if(/\.tsx?$/.test(name)&&!name.includes('/i18n/')){
  const source=ts.createSourceFile(name,fs.readFileSync(name,'utf8'),ts.ScriptTarget.Latest,true,name.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const visit=(node:ts.Node)=>{
   if(ts.isJsxText(node)&&node.text.trim())messages.add(node.text.replace(/\s+/g,' ').trim());
   if(ts.isStringLiteral(node)){
    const p=node.parent;
    if((ts.isPropertyAssignment(p)&&props.includes(p.name.getText(source)))||(ts.isJsxAttribute(p)&&props.includes(p.name.getText(source)))||((ts.isCallExpression(p)||ts.isNewExpression(p))&&['t','setError','setStatus','setMapStatus','Error'].includes(p.expression.getText(source))))messages.add(node.text);
    for(let a:ts.Node|undefined=node.parent;a&&!ts.isSourceFile(a);a=a.parent){
     if(ts.isJsxAttribute(a)&&props.includes(a.name.getText(source)))messages.add(node.text);
     if(ts.isJsxExpression(a)&&ts.isJsxElement(a.parent)&&['Text','InfoButton'].includes(a.parent.openingElement.tagName.getText(source)))messages.add(node.text);
    }
   }ts.forEachChild(node,visit);
  };visit(source);
 }}};walk(path.resolve('src'));
 const missing=[...messages].filter(s=>/[A-Za-z]{3}/.test(s)&&!s.includes('://')&&!/^[a-z][\w-]*$/.test(s)&&!properNamesAndUnits.has(s)&&translate(s,'it')===s);
 assert.deepEqual(missing.sort(),[]);
});
