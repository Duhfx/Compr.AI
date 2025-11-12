// tests/test-normalize-item.js
// Script de teste para a API normalize-item

const testNormalizeItem = async () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000';
  const endpoint = `${baseUrl}/api/normalize-item`;

  console.log('🧪 Testando API: /api/normalize-item');
  console.log(`📍 URL: ${endpoint}\n`);

  const testCases = [
    { input: 'leite integral itambé', expected: 'Leite Integral' },
    { input: 'ARROZ TIPO 1 5KG', expected: 'Arroz' },
    { input: 'pao frances', expected: 'Pão' },
    { input: 'coca cola 2l', expected: 'Refrigerante' },
    { input: 'sabao em po omo', expected: 'Sabão' }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const { input, expected } = testCases[i];
    console.log(`Test ${i + 1}: Normalizar "${input}"`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawName: input })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Sucesso!');
        console.log(`   Original:    "${input}"`);
        console.log(`   Normalizado: "${data.normalized}"`);
        console.log(`   Categoria:   ${data.category || 'N/A'}`);
        console.log(`   Unidade:     ${data.suggestedUnit || 'N/A'}`);

        if (data.normalized.toLowerCase().includes(expected.toLowerCase())) {
          console.log('   ✓ Nome contém palavra-chave esperada');
        } else {
          console.log(`   ⚠️  Nome não contém "${expected}" (não é erro crítico)`);
        }
      } else {
        console.log('❌ Erro:', data.error || data.message);
      }
    } catch (error) {
      console.log('❌ Exceção:', error.message);
    }

    console.log('\n---\n');
  }

  // Test: Sem rawName (deve falhar)
  console.log('Test: Sem rawName (deve retornar erro)');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
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

  // Test: String vazia (deve falhar)
  console.log('Test: String vazia (deve retornar erro)');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawName: '   ' })
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

  // Test: Método GET (deve falhar)
  console.log('Test: Método GET (deve retornar 405)');
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
testNormalizeItem().catch(console.error);
