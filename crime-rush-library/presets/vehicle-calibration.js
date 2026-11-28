// Individual visual calibration of the original WebP rear views, inspected at
// e04156663b0d48a5b2dd57cd9949661f4215da2d. Normalized coordinates refer to
// the entire original image before mirroring. Initial annotations are visual
// estimates, not photogrammetric measurements. Angles are nominal editable keys.
// rear axle contacts: [left x,y,right x,y]; brake rectangles: [x,y,w,h];
// exhaust: visible outlet center or null when not identifiable.
(function(root){
const rows={
 pobeditel:{
  rear:[0,[.13,.956,.87,.956],null,[[.105,.658,.074,.043],[.822,.658,.076,.043]]],
  'rear-05':[5,[.105,.985,.805,.986],null,[[.061,.682,.065,.046],[.691,.686,.065,.046]]],
  'rear-10':[10,[.13,.938,.66,.950],null,[[.057,.647,.036,.036],[.532,.656,.044,.036]]],
  'rear-15':[15,[.154,.916,.594,.943],null,[[.040,.638,.034,.038],[.416,.652,.046,.039]]],
  'rear-20':[20,[.154,.926,.594,.958],null,[[.040,.638,.034,.038],[.430,.659,.046,.040]]]
 },
 sputnik:{
  rear:[0,[.090,.976,.905,.976],[.232,.902],[[.123,.550,.178,.064],[.700,.550,.174,.064]]],
  'rear-05':[5,[.091,.976,.904,.976],[.224,.901],[[.122,.551,.174,.063],[.701,.551,.176,.063]]],
  'rear-10':[10,[.092,.980,.839,.982],[.199,.908],[[.112,.564,.167,.067],[.610,.564,.167,.067]]],
  'rear-15':[15,[.082,.979,.759,.980],[.176,.897],[[.092,.555,.138,.066],[.526,.555,.138,.066]]],
  'rear-20':[20,[.099,.977,.710,.978],[.168,.900],[[.077,.562,.124,.067],[.472,.562,.127,.067]]]
 },
 yaichnitsa:{
  rear:[0,[.091,.981,.906,.981],[.720,.922],[[.177,.616,.086,.059],[.730,.616,.090,.059]]],
  'rear-10':[10,[.084,.980,.785,.986],[.550,.955],[[.124,.637,.080,.061],[.554,.637,.078,.061]]],
  'rear-15':[15,[.107,.982,.714,.989],[.453,.933],[[.106,.614,.061,.063],[.453,.615,.080,.063]]],
  'rear-20':[20,[.118,.944,.564,.985],[.304,.939],[[.084,.600,.045,.047],[.304,.620,.056,.049]]]
 },
 vasilek:{
  rear:[0,[.089,.980,.901,.980],[.696,.917],[[.096,.580,.168,.049],[.734,.580,.170,.049]]],
  'rear-10':[10,[.119,.977,.806,.986],[.541,.916],[[.067,.572,.144,.057],[.582,.572,.143,.057]]],
  'rear-15':[15,[.142,.977,.725,.985],[.448,.914],[[.057,.564,.109,.055],[.485,.564,.116,.055]]],
  'rear-20':[20,[.148,.974,.676,.988],[.405,.918],[[.056,.565,.112,.054],[.428,.565,.130,.054]]]
 },
 'm412-01':{
  rear:[0,[.125,.967,.864,.967],[.685,.904],[[.151,.621,.097,.061],[.749,.621,.097,.061]]],
  'rear-05':[5,[.135,.966,.863,.966],[.682,.893],[[.146,.610,.101,.060],[.748,.610,.100,.060]]],
  'rear-10':[10,[.154,.969,.775,.972],[.550,.864],[[.126,.587,.082,.057],[.609,.587,.089,.057]]],
  'rear-15':[15,[.165,.947,.717,.961],[.453,.857],[[.094,.581,.071,.054],[.502,.581,.075,.054]]],
  'rear-20':[20,[.160,.925,.621,.951],[.369,.855],[[.068,.578,.054,.052],[.403,.580,.069,.052]]]
 }
};
const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=1);
function validate(p){if(!p||!Number.isFinite(p.angle)||p.angle<0||p.angle>40||!Array.isArray(p.axle)||p.axle.length!==4||!validPoint(p.axle.slice(0,2))||!validPoint(p.axle.slice(2))||p.axle[2]-p.axle[0]<.05||Math.abs(p.axle[1]-p.axle[3])>.2||!Array.isArray(p.brakes)||p.brakes.length>4||!p.brakes.every(r=>Array.isArray(r)&&r.length===4&&r.every(Number.isFinite)&&r[0]>=0&&r[1]>=0&&r[2]>0&&r[3]>0&&r[0]+r[2]<=1&&r[1]+r[3]<=1)||!(p.exhaust===null||validPoint(p.exhaust)))throw Error('Invalid vehicle calibration');return {angle:p.angle,axle:[...p.axle],exhaust:p.exhaust&&[...p.exhaust],brakes:p.brakes.map(r=>[...r])};}
const profiles=Object.fromEntries(Object.entries(rows).map(([id,views])=>[id,Object.fromEntries(Object.entries(views).map(([role,[angle,axle,exhaust,brakes]])=>[role,validate({angle,axle,exhaust,brakes})]))]));
function get(id,role){const p=profiles[id]?.[role];return p?validate(p):null;}
const api={profiles,get,validate};if(typeof module!=='undefined')module.exports=api;else root.CrimeRushVehicleCalibration=api;
})(typeof window!=='undefined'?window:globalThis);
