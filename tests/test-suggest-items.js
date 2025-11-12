// tests/test-suggest-items.js
// Script de teste para a API suggest-items

const testSuggestItems = async () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000';
  const endpoint = `${baseUrl}/api/suggest-items`;

  console.log('🧪 Testando API: /api/suggest-items');
  console.log(`📍 URL: ${endpoint}\n`);

  // Test 1: Sugestão básica
  console.log('Test 1: Sugestão básica para "churrasco"');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'test-device-123',
        prompt: 'churrasco',
        maxResults: 5
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Sucesso!');
      console.log(`📋 Recebeu ${data.items?.length || 0} sugestões:`);
      data.items?.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.name} (${item.quantity} ${item.unit}) - ${item.category}`);
      });
    } else {
      console.log('❌ Erro:', data.error || data.message);
    }
  } catch (error) {
    console.log('❌ Exceção:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Lista de café da manhã
  console.log('Test 2: Lista de café da manhã');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'test-device-123',
        listType: 'café da manhã saudável',
        maxResults: 8
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Sucesso!');
      console.log(`📋 Recebeu ${data.items?.length || 0} sugestões:`);
      data.items?.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.name} (${item.quantity} ${item.unit}) - ${item.category}`);
      });
    } else {
      console.log('❌ Erro:', data.error || data.message);
    }
  } catch (error) {
    console.log('❌ Exceção:', error.message);
  }

  console.log('\n---\n');

  // Test 3: Sem deviceId (deve falhar)
  console.log('Test 3: Sem deviceId (deve retornar erro)');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'teste'
      })
    });

    const data = await response.json();

    if (response.status === 400 && data.error) {
      console.log('✅ Erro esperado capturado:', data.error);
    } else {
      console.log('❌ Deveria ter retornado erro 400');
    }
  } catch (error) {
    console.log('❌ Exceção:', error.message);
  }

  console.log('\n---\n');

  // Test 4: Método GET (deve falhar)
  console.log('Test 4: Método GET (deve retornar 405)');
  try {
    const response = await fetch(endpoint, {
      method: 'GET'
    });

    const data = await response.json();

    if (response.status === 405) {
      console.log('✅ Método não permitido capturado:', data.error);
    } else {
      console.log('❌ Deveria ter retornado erro 405');
    }
  } catch (error) {
    console.log('❌ Exceção:', error.message);
  }

  console.log('\n🏁 Testes concluídos!\n');
};

// Executar testes
testSuggestItems().catch(console.error);
