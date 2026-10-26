const fs=require('fs'),cp=require('child_process');
const parse=s=>JSON.parse(s.replace(/^\uFEFF/,'').replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,''));
const read=p=>parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const labels=read('locales/en.default.schema.json').ps4;
Object.assign(labels,{heading_style:'Heading font',serif:'Classic serif',theme:'Theme heading font',hero_asset:'Birthday hero photo',jules_asset:'Jules portrait',collar_asset:'Green collar',toy_asset:'Rope toy',pouch_asset:'Treat pouch',none:'No bundled image'});
for(const file of fs.readdirSync('locales').filter(f=>f.endsWith('.schema.json'))){
  const path='locales/'+file;
  const original=file==='en.default.schema.json'?cp.execFileSync('git',['show','HEAD:'+path],{encoding:'utf8'}):fs.readFileSync(path,'utf8');
  fs.writeFileSync(path,original.replace(/\{/, '{\n  "ps4": '+JSON.stringify(labels,null,2)+','));
}
for(const name of ['hero','cards','feature','newsletter']){
 const path='sections/ps4-'+name+'.liquid';let src=fs.readFileSync(path,'utf8');
 const match=src.match(/{% schema %}\n([\s\S]*?)\n{% endschema %}/);const schema=JSON.parse(match[1]);
 schema.settings=schema.settings.filter(s=>!(name==='hero'&&s.id==='eyebrow')&&!(name==='cards'&&['text','eyebrow'].includes(s.id))&&!(name==='newsletter'&&['eyebrow','link'].includes(s.id)));
 schema.settings.push({type:'select',id:'heading_style',label:'t:ps4.heading_style',options:[{value:'serif',label:'t:ps4.serif'},{value:'theme',label:'t:ps4.theme'}],default:'serif'});
 if(name==='hero')schema.settings.find(s=>s.id==='heading').type='textarea';
 for(const settings of [schema.settings,...(schema.blocks||[]).map(b=>b.settings)]){
  for(const s of settings){if(s.id==='asset')for(const o of s.options)o.label='t:ps4.'+(o.value==='none'?'none':o.value+'_asset');}
 }
 if(name==='cards')schema.blocks[0].settings.find(s=>s.id==='heading').type='textarea';
 src=src.replace(match[0],'{% schema %}\n'+JSON.stringify(schema,null,2)+'\n{% endschema %}');
 src=src.replace('--ps4-background: {{ section.settings.background }};',`--ps4-background: {{ section.settings.background }}; --ps4-heading-font: {% if section.settings.heading_style == 'theme' %}var(--font-heading--family){% else %}Georgia, 'Times New Roman', serif{% endif %};`);
 fs.writeFileSync(path,src);
}
let image=fs.readFileSync('snippets/ps4-home-image.liquid','utf8');
image=image.replace("assign filename = ''","assign filename = ''\nassign intrinsic_width = 1672\nassign intrinsic_height = 941");
image=image.replace("assign filename = 'ps4-jules.jpg'","assign filename = 'ps4-jules.jpg'\nassign intrinsic_width = 1592\nassign intrinsic_height = 2166");
for(const [name,w,h] of [['collar',518,500],['toy',518,500],['pouch',481,500]])image=image.replace(`assign filename = 'ps4-${name}.png'`,`assign filename = 'ps4-${name}.png'\nassign intrinsic_width = ${w}\nassign intrinsic_height = ${h}`);
image=image.replace("{{ width | default: 1672 }}","{{ intrinsic_width }}").replace("{{ height | default: 941 }}","{{ intrinsic_height }}");fs.writeFileSync('snippets/ps4-home-image.liquid',image);
let css=fs.readFileSync('snippets/ps4-home-styles.liquid','utf8').replace('font-family: var(--font-heading--family);','font-family: var(--ps4-heading-font, var(--font-heading--family));').replaceAll('--button-secondary-background-color','--color-secondary-button-background').replaceAll('--button-secondary-color','--color-secondary-button-text').replaceAll('--button-secondary-border-color','--color-secondary-button-border');
css=css.replace('inset: 0; z-index: -2;','inset: 0; inset-inline-start: 24%; z-index: -2;').replace('position: relative; inline-size: 100%; order: 1;','position: relative; inset: auto; inline-size: 100%; order: 1;');
css=css.replace('linear-gradient(90deg,','linear-gradient(to right,');
css=css.replace('  .ps4-hero__content {',"  [dir='rtl'] .ps4-hero::after { background: linear-gradient(to left, var(--ps4-background) 0%, var(--ps4-background) 25%, transparent 68%); }\n  .ps4-hero__content {");
fs.writeFileSync('snippets/ps4-home-styles.liquid',css);
const footer=read('sections/footer-group.json');const main=footer.sections.footer_m9NzUG;
const group=structuredClone(main.blocks.group_H6VpwJ);const heading=structuredClone(group.blocks.text_LWt8Pz),body=structuredClone(group.blocks.text_f9CFLH);
main.blocks.group_H6VpwJ.blocks.text_LWt8Pz.settings.text='<h2>PS4PETS</h2>';
main.blocks.group_H6VpwJ.blocks.text_f9CFLH.settings.text='<p>Everything They Need.<br/>More Love With Every Order.</p>';
main.block_order=main.block_order.filter(id=>id!=='email_signup_crihX7');delete main.blocks.email_signup_crihX7;
const groups=[['Mission',[['Our Story','/pages/meet-jules'],['Our Impact','/pages/mission'],['Helping Shelter Pets','/pages/mission'],['Jules’ Story','/pages/meet-jules']]],['Customer Service',[['Help Center','/pages/contact'],['Track Your Order','/pages/contact'],['Product Care','/pages/product-care'],['Contact Us','/pages/contact']]],['Shipping & Returns',[['Shipping Information','/pages/shipping'],['Returns & Exchanges','/pages/returns']]],['Legal',[['Privacy Policy','/policies/privacy-policy'],['Terms of Service','/policies/terms-of-service']]],['Shelter Program',[['Program Information (Where Finalized)','/pages/shelter-program']]],['Contact',[['hello@ps4pets.com','mailto:hello@ps4pets.com'],['PS4pets.com','/']]]];
for(const [i,[title,links]] of groups.entries()){
 const id='ps4_footer_'+i;const g=structuredClone(group);g.blocks={heading:structuredClone(heading),body:structuredClone(body)};g.block_order=['heading','body'];g.blocks.heading.settings.text='<p><strong>'+title+'</strong></p>';g.blocks.heading.settings.type_preset='paragraph';g.blocks.body.settings.text=links.map(([text,url])=>'<p><a href="'+url+'">'+text+'</a></p>').join('');main.blocks[id]=g;main.block_order.push(id);
}
main.settings.background_color='#193e36';main.settings.gap=24;
footer.sections.footer_utilities_jLGE8U.settings.background_color='#193e36';
footer.sections.footer_utilities_jLGE8U.blocks.footer_copyright_jweRK8.settings.show_powered_by=false;
// Empty social settings avoid linking customers to the networks' generic homepages.
for(const key of Object.keys(footer.sections.footer_utilities_jLGE8U.blocks.social_links_Ew63Kq.settings))footer.sections.footer_utilities_jLGE8U.blocks.social_links_Ew63Kq.settings[key]='';
write('sections/footer-group.json',footer);
const home=read('templates/index.json');home.sections.ps4_promos.blocks.card_0.settings.text+='<p>♡ Shop for yours. Help one waiting for theirs.</p><p>♡ Every pet deserves someone in their corner.</p><p>♡ For Pets. For Families. For Those Still Waiting for Theirs.</p>';
for(const section of Object.values(home.sections))if(section.type==='ps4-cards')for(const block of Object.values(section.blocks))if(block.settings.asset!=='none'&&!block.settings.image_alt)block.settings.image_alt=block.settings.asset==='jules'?'Jules, our rescue pup':({collar:'Green everyday pet collar',toy:'Green rope toy',pouch:'Green pet treat pouch'})[block.settings.asset]||'';
write('templates/index.json',home);
