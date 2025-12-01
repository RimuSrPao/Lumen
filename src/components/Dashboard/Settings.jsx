import React, { useState, useEffect } from 'react';
import styles from './Settings.module.css';
import { User, Bell, Lock, Palette, Shield } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export function Settings({ user }) {
    const [activeTab, setActiveTab] = useState('profile');
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    // Carregar configurações ao montar
    useEffect(() => {
        loadSettings();
    }, [user?.uid]);

    // Aplicar fontSize quando settings mudar
    useEffect(() => {
        if (settings?.preferences?.fontSize) {
            applyFontSize(settings.preferences.fontSize);
        }
    }, [settings]);

    const loadSettings = async () => {
        if (!user?.uid) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const loadedSettings = userDoc.data().settings || {
                    notifications: {
                        likes: true,
                        comments: true,
                        messages: true,
                        mentions: true
                    },
                    privacy: {
                        whoCanSeePosts: 'public',
                        whoCanMessage: 'everyone',
                        publicProfile: true
                    },
                    preferences: {
                        language: 'pt-BR',
                        fontSize: 'medium'
                    }
                };
                setSettings(loadedSettings);

                // Aplicar fontSize ao carregar
                applyFontSize(loadedSettings.preferences?.fontSize);
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (newSettings) => {
        if (!user?.uid) return;

        try {
            await updateDoc(doc(db, 'users', user.uid), {
                settings: newSettings
            });
            setSettings(newSettings);
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
        }
    };

    // Aplicar tamanho de fonte ao body
    const applyFontSize = (fontSize) => {
        const size = fontSize || 'medium';
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${size}`);
    };

    const tabs = [
        { id: 'profile', icon: User, label: 'Perfil' },
        { id: 'notifications', icon: Bell, label: 'Notificações' },
        { id: 'privacy', icon: Lock, label: 'Privacidade' },
        { id: 'preferences', icon: Palette, label: 'Preferências' },
        { id: 'account', icon: Shield, label: 'Conta' },
    ];

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Carregando...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Configurações</h1>
                <p className={styles.subtitle}>Gerencie suas preferências e configurações da conta</p>
            </div>

            <div className={styles.content}>
                {/* Sidebar com Tabs */}
                <div className={styles.sidebar}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={20} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content */}
                <div className={styles.main}>
                    {activeTab === 'profile' && <ProfileSettings user={user} />}
                    {activeTab === 'notifications' && (
                        <NotificationSettings
                            settings={settings}
                            onUpdate={updateSettings}
                        />
                    )}
                    {activeTab === 'privacy' && (
                        <PrivacySettings
                            settings={settings}
                            onUpdate={updateSettings}
                        />
                    )}
                    {activeTab === 'preferences' && (
                        <PreferencesSettings
                            settings={settings}
                            onUpdate={updateSettings}
                        />
                    )}
                    {activeTab === 'account' && <AccountSettings user={user} />}
                </div>
            </div>
        </div>
    );
}

// Profile Settings
function ProfileSettings({ user }) {
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!user?.uid) return;

        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                displayName: displayName
            });
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar alterações');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Informações do Perfil</h2>
            <p className={styles.sectionDescription}>
                Atualize suas informações pessoais e como você aparece para outros usuários.
            </p>

            <div className={styles.settingGroup}>
                <label className={styles.label}>Nome de exibição</label>
                <input
                    type="text"
                    className={styles.input}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                />
            </div>

            <div className={styles.settingGroup}>
                <label className={styles.label}>Email</label>
                <input
                    type="email"
                    className={styles.input}
                    defaultValue={user?.email || ''}
                    disabled
                />
                <span className={styles.hint}>O email não pode ser alterado</span>
            </div>

            <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={saving}
            >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
        </div>
    );
}

// Notification Settings
function NotificationSettings({ settings, onUpdate }) {
    const handleToggle = (key) => {
        const newSettings = {
            ...settings,
            notifications: {
                ...settings.notifications,
                [key]: !settings.notifications[key]
            }
        };
        onUpdate(newSettings);
    };

    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Preferências de Notificações</h2>
            <p className={styles.sectionDescription}>
                Escolha quais notificações você deseja receber.
            </p>

            <div className={styles.settingGroup}>
                <div className={styles.switchRow}>
                    <div>
                        <div className={styles.switchLabel}>Curtidas em posts</div>
                        <div className={styles.switchDescription}>Receba notificações quando alguém curtir seus posts</div>
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={settings?.notifications?.likes || false}
                            onChange={() => handleToggle('likes')}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>
            </div>

            <div className={styles.settingGroup}>
                <div className={styles.switchRow}>
                    <div>
                        <div className={styles.switchLabel}>Comentários</div>
                        <div className={styles.switchDescription}>Receba notificações de novos comentários</div>
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={settings?.notifications?.comments || false}
                            onChange={() => handleToggle('comments')}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>
            </div>

            <div className={styles.settingGroup}>
                <div className={styles.switchRow}>
                    <div>
                        <div className={styles.switchLabel}>Mensagens diretas</div>
                        <div className={styles.switchDescription}>Receba notificações de novas mensagens</div>
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={settings?.notifications?.messages || false}
                            onChange={() => handleToggle('messages')}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>
            </div>

            <div className={styles.settingGroup}>
                <div className={styles.switchRow}>
                    <div>
                        <div className={styles.switchLabel}>Menções</div>
                        <div className={styles.switchDescription}>Receba notificações quando alguém mencionar você</div>
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={settings?.notifications?.mentions || false}
                            onChange={() => handleToggle('mentions')}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>
            </div>
        </div>
    );
}

// Privacy Settings
function PrivacySettings({ settings, onUpdate }) {
    const handleSelectChange = (key, value) => {
        const newSettings = {
            ...settings,
            privacy: {
                ...settings.privacy,
                [key]: value
            }
        };
        onUpdate(newSettings);
    };

    const handleToggle = () => {
        const newSettings = {
            ...settings,
            privacy: {
                ...settings.privacy,
                publicProfile: !settings.privacy.publicProfile
            }
        };
        onUpdate(newSettings);
    };

    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Privacidade e Segurança</h2>
            <p className={styles.sectionDescription}>
                Controle quem pode ver seu conteúdo e interagir com você.
            </p>

            <div className={styles.settingGroup}>
                <label className={styles.label}>Quem pode ver seus posts</label>
                <select
                    className={styles.select}
                    value={settings?.privacy?.whoCanSeePosts || 'public'}
                    onChange={(e) => handleSelectChange('whoCanSeePosts', e.target.value)}
                >
                    <option value="public">Todos</option>
                    <option value="friends">Apenas amigos</option>
                    <option value="private">Apenas eu</option>
                </select>
            </div>

            <div className={styles.settingGroup}>
                <label className={styles.label}>Quem pode enviar mensagens</label>
                <select
                    className={styles.select}
                    value={settings?.privacy?.whoCanMessage || 'everyone'}
                    onChange={(e) => handleSelectChange('whoCanMessage', e.target.value)}
                >
                    <option value="everyone">Todos</option>
                    <option value="friends">Apenas amigos</option>
                </select>
            </div>

            <div className={styles.settingGroup}>
                <div className={styles.switchRow}>
                    <div>
                        <div className={styles.switchLabel}>Perfil público</div>
                        <div className={styles.switchDescription}>Permitir que qualquer pessoa veja seu perfil</div>
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={settings?.privacy?.publicProfile || false}
                            onChange={handleToggle}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>
            </div>
        </div>
    );
}

// Preferences Settings
function PreferencesSettings({ settings, onUpdate }) {
    const handleSelectChange = (key, value) => {
        const newSettings = {
            ...settings,
            preferences: {
                ...settings.preferences,
                [key]: value
            }
        };
        onUpdate(newSettings);
    };

    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Preferências</h2>
            <p className={styles.sectionDescription}>
                Personalize sua experiência no Lumen.
            </p>

            <div className={styles.settingGroup}>
                <label className={styles.label}>Idioma</label>
                <select
                    className={styles.select}
                    value={settings?.preferences?.language || 'pt-BR'}
                    onChange={(e) => handleSelectChange('language', e.target.value)}
                >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                </select>
            </div>

            <div className={styles.settingGroup}>
                <label className={styles.label}>Tamanho da fonte</label>
                <select
                    className={styles.select}
                    value={settings?.preferences?.fontSize || 'medium'}
                    onChange={(e) => handleSelectChange('fontSize', e.target.value)}
                >
                    <option value="small">Pequeno</option>
                    <option value="medium">Médio</option>
                    <option value="large">Grande</option>
                </select>
            </div>
        </div>
    );
}

// Account Settings
function AccountSettings({ user }) {
    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Configurações da Conta</h2>
            <p className={styles.sectionDescription}>
                Gerencie sua conta e dados.
            </p>

            <div className={styles.settingGroup}>
                <button className={styles.secondaryButton}>Alterar Senha</button>
            </div>

            <div className={styles.settingGroup}>
                <button className={styles.secondaryButton}>Baixar Meus Dados</button>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.settingGroup}>
                <h3 className={styles.dangerTitle}>Zona de Perigo</h3>
                <p className={styles.dangerDescription}>
                    Ações irreversíveis que afetam permanentemente sua conta.
                </p>
                <button className={styles.dangerButton}>Excluir Conta</button>
            </div>
        </div>
    );
}
