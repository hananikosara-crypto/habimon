'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  // サインイン用フォーム状態
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInError, setSignInError] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)

  // サインアップ用フォーム状態
  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpError, setSignUpError] = useState('')
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignInError('')
    setSignInLoading(true)
    const { error } = await signIn(signInEmail, signInPassword)
    setSignInLoading(false)
    if (error) {
      setSignInError('メールアドレスまたはパスワードが正しくありません')
    } else {
      router.replace('/dashboard')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignUpError('')
    if (signUpPassword.length < 6) {
      setSignUpError('パスワードは6文字以上で入力してください')
      return
    }
    setSignUpLoading(true)
    const { error, needsEmailConfirmation } = await signUp(signUpEmail, signUpPassword, signUpName)
    setSignUpLoading(false)
    if (error) {
      if (error.message.includes('already registered')) {
        setSignUpError('このメールアドレスはすでに登録されています')
      } else {
        setSignUpError('登録に失敗しました。もう一度お試しください')
      }
    } else if (needsEmailConfirmation) {
      setSignUpSuccess(true)
    } else {
      router.replace('/onboarding')
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-white min-h-screen">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🥚</div>
          <h1 className="text-3xl font-bold text-emerald-700">HabiMon</h1>
          <p className="text-muted-foreground mt-1">習慣を続けてモンスターを育てよう！</p>
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">ログイン</TabsTrigger>
            <TabsTrigger value="signup">新規登録</TabsTrigger>
          </TabsList>

          {/* ログインタブ */}
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>ログイン</CardTitle>
                <CardDescription>アカウントにサインインしてください</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">メールアドレス</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="example@email.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">パスワード</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  {signInError && (
                    <p className="text-sm text-destructive">{signInError}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={signInLoading}>
                    {signInLoading ? 'ログイン中...' : 'ログイン'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 新規登録タブ */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>新規登録</CardTitle>
                <CardDescription>無料アカウントを作成しましょう</CardDescription>
              </CardHeader>
              <CardContent>
                {signUpSuccess ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="text-4xl">📧</div>
                    <p className="font-medium">確認メールを送信しました</p>
                    <p className="text-sm text-muted-foreground">
                      {signUpEmail} に届いたメールのリンクをクリックして、アカウントを有効化してください。
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">ニックネーム</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="ハビモン太郎"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        required
                        autoComplete="nickname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">メールアドレス</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="example@email.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">パスワード</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="6文字以上"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    {signUpError && (
                      <p className="text-sm text-destructive">{signUpError}</p>
                    )}
                    <Button type="submit" className="w-full" disabled={signUpLoading}>
                      {signUpLoading ? '登録中...' : 'アカウントを作成'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
