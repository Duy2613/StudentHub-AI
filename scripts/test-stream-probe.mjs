async function testProdStream() {
  const url = 'https://student-hub-ai-topaz.vercel.app/api/v1/trust';
  console.log('Sending streaming request to:', url);
  const t0 = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream, application/json',
      'X-Request-ID': 'test-stream-' + Date.now(),
    },
    body: JSON.stringify({
      type: 'text',
      content: 'Khoa CNTT thông báo lịch thi kết thúc học phần học kỳ 2 năm học 2025-2026',
      depth: 'full',
      version: 'v5',
      stream: true,
    }),
  });
  console.log('Status:', res.status, res.statusText);
  console.log('Headers:', Object.fromEntries([...res.headers.entries()]));
  if (!res.body) {
    console.log('No body!');
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let receivedChunks = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log('Stream done after ' + (Date.now() - t0) + 'ms. Total chunks: ' + receivedChunks);
      break;
    }
    receivedChunks++;
    const text = decoder.decode(value);
    console.log('[Chunk ' + receivedChunks + '] (+' + (Date.now() - t0) + 'ms, ' + text.length + ' chars): ' + text.slice(0, 150).replace(/\n/g, ' '));
  }
}
testProdStream().catch(console.error);
