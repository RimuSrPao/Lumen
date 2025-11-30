import { useState } from 'react';
import './Login.css';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { Toast } from './Toast';

export function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [toast, setToast] = useState(null); // { message, type }

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isLogin) {
            // Login Real
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                showToast(`Bem-vindo de volta, ${userCredential.user.displayName || email}!`, 'success');
            } catch (error) {
                console.error(error);
                if (error.code === 'auth/invalid-credential') {
                    setError('Email ou senha incorretos.');
                } else {
                    setError('Erro ao fazer login. Tente novamente.');
                }
            }
        } else {
            // Cadastro Real
            if (password !== confirmPassword) {
                setError('As senhas não coincidem.');
                return;
            }
            if (!name || !email || !password) {
                setError('Preencha todos os campos.');
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Atualizar nome do usuário
                await updateProfile(userCredential.user, { displayName: name });

                showToast(`Conta criada com sucesso para ${name}!`, 'success');
                setIsLogin(true); // Mudar para tela de login ou logar direto
            } catch (error) {
                console.error(error);
                if (error.code === 'auth/email-already-in-use') {
                    setError('Este email já está cadastrado.');
                } else if (error.code === 'auth/weak-password') {
                    setError('A senha deve ter pelo menos 6 caracteres.');
                } else {
                    setError('Erro ao criar conta: ' + error.message);
                }
            }
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        if (!email) {
            setError('Por favor, informe seu email.');
            return;
        }
        try {
            // Tenta verificar métodos de login associados ao email
            const methods = await fetchSignInMethodsForEmail(auth, email);

            if (methods.length === 0) {
                setError('Nenhuma conta encontrada com este email.');
                return;
            }

            await sendPasswordResetEmail(auth, email);
            showToast('Email de recuperação enviado! Verifique sua caixa de entrada.', 'success');
            setIsResetPassword(false);
            setIsLogin(true);
        } catch (error) {
            console.error("Erro na recuperação:", error);
            if (error.code === 'auth/user-not-found') {
                setError('Nenhuma conta encontrada com este email.');
            } else if (error.code === 'auth/invalid-email') {
                setError('Email inválido.');
            } else {
                // Fallback para caso a proteção de enumeração esteja ativa e impeça fetchSignInMethods
                // Nesse caso, tentamos enviar direto se o erro não for claro
                console.warn("Erro ao verificar email, tentando envio direto:", error.code);
                try {
                    await sendPasswordResetEmail(auth, email);
                    showToast('Se este email estiver cadastrado, você receberá um link de recuperação.', 'info');
                    setIsResetPassword(false);
                    setIsLogin(true);
                } catch (sendError) {
                    setError('Erro ao processar solicitação: ' + sendError.message);
                }
            }
        }
    };

    const handleGoogleLogin = async () => {
        try {
            googleProvider.setCustomParameters({ prompt: 'select_account' });
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            showToast(`Bem-vindo, ${user.displayName}! Login com Google realizado.`, 'success');
        } catch (error) {
            console.error(error);
            setError('Erro ao conectar com Google. Verifique a configuração do Firebase.');
        }
    };

    return (
        <div className="lumen-container">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="lumen-left">
                <div className="lumen-header">
                    <div className="brand-logo">
                        <div className="logo-circle"></div>
                        <span>Lumen</span>
                    </div>
                </div>

                <div className="lumen-content">
                    <h1>
                        {isResetPassword
                            ? 'Recuperar senha.'
                            : isLogin ? 'Bem-vindo de volta.' : 'Comece grátis.'}
                    </h1>
                    <h2>
                        {isResetPassword
                            ? 'Informe seu email para receber o link.'
                            : isLogin ? 'Faça login na sua conta.' : 'Crie sua nova conta.'}
                    </h2>

                    <p className="subtitle">
                        {isResetPassword ? (
                            <button onClick={() => { setIsResetPassword(false); setError(''); }} className="link-btn">
                                Voltar para o Login
                            </button>
                        ) : (
                            <>
                                {isLogin ? 'Não é membro? ' : 'Já é membro? '}
                                <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="link-btn">
                                    {isLogin ? 'Crie uma conta' : 'Faça Login'}
                                </button>
                            </>
                        )}
                    </p>

                    <form onSubmit={isResetPassword ? handleResetPassword : handleSubmit} className="lumen-form">
                        {!isLogin && !isResetPassword && (
                            <div className="input-group">
                                <label>Nome</label>
                                <input
                                    type="text"
                                    placeholder="Seu nome"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label>Email</label>
                            <input
                                type="text"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {!isResetPassword && (
                            <div className="input-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label>Senha</label>
                                    {isLogin && (
                                        <button
                                            type="button"
                                            className="link-btn"
                                            style={{ fontSize: '0.85rem' }}
                                            onClick={() => { setIsResetPassword(true); setError(''); }}
                                        >
                                            Esqueceu a senha?
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        )}

                        {!isLogin && !isResetPassword && (
                            <div className="input-group">
                                <label>Confirmar Senha</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        )}

                        {error && <div className="error-message">{error}</div>}

                        <div className="form-actions">
                            {!isResetPassword && (
                                <button type="button" className="google-btn" onClick={handleGoogleLogin}>
                                    <svg className="google-icon" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                </button>
                            )}
                            <button type="submit" className="submit-btn" style={isResetPassword ? { width: '100%' } : {}}>
                                {isResetPassword ? 'Enviar Email' : (isLogin ? 'Entrar' : 'Criar conta')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="lumen-right">
                {/* Imagem de fundo via CSS */}
            </div>
        </div>
    );
}
