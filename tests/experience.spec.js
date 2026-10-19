const {test,expect}=require('@playwright/test');
function futureDate(days=7){const date=new Date();date.setDate(date.getDate()+days);return date.toISOString().slice(0,10);}
async function fillBooking(page,{name='Piloto de teste',date=futureDate(),time='09:00'}={}){
 await page.locator('#booking-name').fill(name);
 await page.locator('#booking-date').fill(date);
 await page.locator('#booking-time').selectOption(time);
 await page.locator('input[type=checkbox]').check();
}

test('catálogo Java, páginas individuais e imagens locais',async({page})=>{
 await page.goto('/');await expect(page.locator('.car-card')).toHaveCount(4);
 await page.getByRole('button',{name:'Manual',exact:true}).click();await expect(page.locator('.car-card')).toHaveCount(2);await expect(page.locator('#car-grid')).toContainText('GR Yaris');await expect(page.locator('#car-grid')).toContainText('Sandero RS');
 await page.getByRole('button',{name:'Hot hatch',exact:true}).click();await expect(page.locator('.car-card')).toHaveCount(3);
 await page.getByRole('button',{name:'Superesportivo',exact:true}).click();await expect(page.locator('.car-card')).toHaveCount(1);await expect(page.locator('#car-grid')).toContainText('Porsche');
 for(const [slug,name] of [['golf-gti','Golf GTI'],['porsche-gt4-rs','Porsche GT4 RS'],['sandero-rs','Sandero RS'],['gr-yaris','GR Yaris']]){const response=await page.goto(`/carros/${slug}.html`);expect(response.status()).toBe(200);await expect(page.locator('h1')).toHaveText(name);await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));}
});

test('cria no Java, calcula valor, consulta após recarregar e cancela',async({page,request})=>{
 await page.goto('/carros/gr-yaris.html');await page.locator('#detail-hours').fill('3');await expect(page.locator('#detail-total')).toContainText('3.570');
 await page.locator('.booking-panel [data-book]').click();await expect(page.locator('#booking-hours')).toHaveValue('3');
 await fillBooking(page);await page.getByRole('button',{name:'Consultar disponibilidade'}).click();await expect(page.locator('#availability-result')).toContainText('Horário disponível');
 await page.getByRole('button',{name:'Registrar minha reserva'}).click();await expect(page.locator('.saved-summary')).toContainText('GR Yaris');await expect(page.locator('.saved-summary')).toContainText('3.570');
 const refs=await page.evaluate(()=>JSON.parse(localStorage.getItem('rancing-reservations')));expect(refs).toHaveLength(1);
 const stored=await request.get(`/api/reservas/${refs[0].id}`,{headers:{Authorization:`Bearer ${refs[0].token}`}});expect(stored.status()).toBe(200);expect((await stored.json()).total).toBe(3570);
 await page.keyboard.press('Escape');await page.reload();await page.locator('[data-saved]').click();await expect(page.locator('.saved-summary')).toContainText('GR Yaris');await page.getByRole('button',{name:'Consultar reserva'}).click();await page.getByRole('button',{name:'Cancelar esta reserva'}).click();await expect(page.locator('.reservation-status')).toHaveText('Cancelada');
 const cancelled=await request.get(`/api/reservas/${refs[0].id}`,{headers:{Authorization:`Bearer ${refs[0].token}`}});expect((await cancelled.json()).cancelled).toBe(true);
});

test('outro visitante vê conflito e horário é liberado após cancelamento',async({page,browser})=>{
 await page.goto('/carros/golf-gti.html');await page.locator('.booking-panel [data-book]').click();await fillBooking(page,{date:futureDate(8)});await page.getByRole('button',{name:'Registrar minha reserva'}).click();await expect(page.locator('.saved-summary')).toBeVisible();
 const context=await browser.newContext();const other=await context.newPage();
 try{
  await other.goto('http://127.0.0.1:3108/carros/golf-gti.html');await other.locator('.booking-panel [data-book]').click();await fillBooking(other,{date:futureDate(8),name:'Outro visitante'});await other.getByRole('button',{name:'Consultar disponibilidade'}).click();await expect(other.locator('#availability-result')).toContainText('já está ocupado');
  await other.getByRole('button',{name:'Registrar minha reserva'}).click();await expect(other.locator('#form-error')).toContainText('já está reservado');expect(await other.evaluate(()=>localStorage.getItem('rancing-reservations'))).toBeNull();
  await page.getByRole('button',{name:'Cancelar esta reserva'}).click();await expect(page.locator('.reservation-status')).toHaveText('Cancelada');
  await other.getByRole('button',{name:'Registrar minha reserva'}).click();await expect(other.locator('.saved-summary')).toContainText('Outro visitante');
 }finally{await context.close();}
});

test('formulário valida passado, ciência e horário de encerramento',async({page})=>{
 await page.goto('/');await page.locator('.nav-cta').click();await fillBooking(page,{date:'2000-01-01'});await page.getByRole('button',{name:'Registrar minha reserva'}).click();await expect(page.locator('#booking-form')).toBeVisible();expect(await page.locator('#booking-date').evaluate(i=>i.validity.rangeUnderflow)).toBe(true);expect(await page.evaluate(()=>localStorage.getItem('rancing-reservations'))).toBeNull();
 await page.locator('#booking-date').fill(futureDate());await page.locator('input[type=checkbox]').uncheck();await page.getByRole('button',{name:'Registrar minha reserva'}).click();expect(await page.locator('input[type=checkbox]').evaluate(i=>i.validity.valueMissing)).toBe(true);
 await page.locator('#booking-hours').selectOption('4');expect(await page.locator('#booking-time option[value="17:00"]').isDisabled()).toBe(true);expect(await page.locator('#booking-time option[value="14:00"]').isDisabled()).toBe(false);
});

test('celular, menu, FAQ, foco do modal e ausência de erros JS',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('.car-card')).toHaveCount(4);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.menu-toggle').click();await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded','true');await page.locator('#main-nav a').first().click();await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded','false');
 await page.locator('details summary').first().click();await expect(page.locator('details').first()).toHaveAttribute('open','');await page.locator('.nav-cta').click();await expect(page.locator('.close-modal')).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(page.locator('button[type=submit]')).toBeFocused();await page.keyboard.press('Tab');await expect(page.locator('.close-modal')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('.modal')).toHaveCount(0);await expect(page.locator('.nav-cta')).toBeFocused();
 await page.goto('/carros/porsche-gt4-rs.html');await expect(page.locator('.detail-copy')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});

test('indisponibilidade do Java é exibida sem registrar reserva local falsa',async({page})=>{
 await page.goto('/');await page.locator('.nav-cta').click();await fillBooking(page,{date:futureDate(9)});
 await page.route('**/api/reservas',route=>route.abort());await page.getByRole('button',{name:'Registrar minha reserva'}).click();await expect(page.locator('#form-error')).toContainText('servidor Java');expect(await page.evaluate(()=>localStorage.getItem('rancing-reservations'))).toBeNull();
});
