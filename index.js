// These options should map to the tf backend configuration:
// https://www.terraform.io/docs/backends/types/http.html
const USERNAME = 'CHANGE ME!';
const PASSWORD = 'CHANGE ME!';

const STATE_ENDPOINT = '/';
const UPDATE_METHOD = 'POST';
const LOCK_ENDPOINT = '/';
const LOCK_METHOD = 'LOCK';
const UNLOCK_ENDPOINT = '/';
const UNLOCK_METHOD = 'UNLOCK';

// CF Worker KV configuration
const STATE_NAMESPACE = TERRAFORM;
const STATE_KEY = 'state';
const LOCK_KEY = 'lock';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});

async function handleRequest(request) {
  try {
    {
      // Check authorisation
      let authError = await authenticate(request)
      if (authError) return authError;
    }

    let requestURL = new URL(request.url)
    switch (true) {
      case request.method === 'GET' && requestURL.pathname === STATE_ENDPOINT:
        return await getState();
      case request.method === UPDATE_METHOD && requestURL.pathname === STATE_ENDPOINT:
        return await setState(await request.text());
      case request.method === 'DELETE' && requestURL.pathname === STATE_ENDPOINT:
        return await deleteState();
      case request.method === LOCK_METHOD && requestURL.pathname === LOCK_ENDPOINT:
        return await lockState(await request.text());
      case request.method === UNLOCK_METHOD && requestURL.pathname === UNLOCK_ENDPOINT:
        return await unlockState(await request.text());
    }
    
    return new Response('Nothing found at ' + requestURL.pathname, {status: 404});
  } catch (error) {
    return new Response(error.stack, {status: 500});
  }
}

const expectedToken = btoa([USERNAME, PASSWORD].join(':'));
async function authenticate(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || typeof authHeader !== 'string') {
    return new Response('Missing credentials', { 
      status: 401, 
      headers: {
        "WWW-Authenticate": 'Basic realm="Terraform State"'
      },
    });
  }

  const [scheme, credentials, ...rest] = authHeader.split(' ')
  if (rest.length != 0 || scheme !== 'Basic' || credentials !== expectedToken) {
    return new Response('Invalid credentials', { 
      status: 403, 
      headers: {
        "WWW-Authenticate": 'Basic realm="Terraform State"'
      },
    });
  }

  return void 0
}

async function getState() {
  const state = await STATE_NAMESPACE.get(STATE_KEY);
  if (!state) {
    return new Response('', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response(state || '', {
    headers: {
      'Content-type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
async function setState(body) {
  await STATE_NAMESPACE.put(STATE_KEY, body);
  return new Response(body || '', {
    status: 200,
    headers: {
      'Content-type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
async function deleteState() {
  await STATE_NAMESPACE.delete(STATE_KEY);
  return new Response('', {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

async function lockState(body) {
  const existingLock = await STATE_NAMESPACE.get(LOCK_KEY);
  if (existingLock) {
    return new Response(existingLock, {
      status: 423,
      headers: {
        'Content-type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }
  await STATE_NAMESPACE.put(LOCK_KEY, body);
  return new Response(body, {
    headers: {
      'Content-type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

async function unlockState(body) {
  await STATE_NAMESPACE.delete(LOCK_KEY);
  return new Response('', {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
