// All visitor quantities share the selected locale; dates stay in Venice time.
const locales = {en:'en-GB',tr:'tr-TR',it:'it-IT',fr:'fr-FR',ru:'ru-RU',zh:'zh-CN',ja:'ja-JP',ko:'ko-KR'};
export const visitorLocale = language => locales[language] || locales.en;
export const numberLabel = (value, language) => new Intl.NumberFormat(visitorLocale(language), {maximumFractionDigits:1}).format(value);
export const distanceLabel = (value, language, unit='kilometer') => new Intl.NumberFormat(visitorLocale(language), {style:'unit',unit,unitDisplay:'short',maximumFractionDigits:unit==='meter'?0:1}).format(value);
export const rangeLabel = (start, end, language) => new Intl.NumberFormat(visitorLocale(language), {maximumFractionDigits:1}).formatRange(start,end);
export const dateLabel = (value, language) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '';
  const date = new Date(value+'T12:00:00Z');
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(visitorLocale(language), {timeZone:'Europe/Rome',dateStyle:'long'}).format(date);
};
const stopWords = {en:{one:'stop',other:'stops'},tr:{other:'durak'},it:{one:'tappa',other:'tappe'},fr:{one:'étape',other:'étapes'},ru:{one:'остановка',few:'остановки',many:'остановок',other:'остановки'},zh:{other:'个站点'},ja:{other:'スポット'},ko:{other:'개 장소'}};
export const stopCountLabel = (count, language) => {
  const words=stopWords[language] || stopWords.en;
  const form=new Intl.PluralRules(visitorLocale(language)).select(count);
  return `${numberLabel(count,language)} ${words[form] || words.other}`;
};
