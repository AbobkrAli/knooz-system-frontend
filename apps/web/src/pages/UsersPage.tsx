import {
  PopoverForm,
  PopoverFormBody,
  PopoverFormButton,
  PopoverFormField,
  PopoverFormSuccess,
  popoverFormControlClass,
} from "@/components/PopoverForm"
import { createUser, deleteUser, getUsers, updateUser } from "@/lib/api"
import type { User } from "@/lib/api"
import { err, localeAr, roleAr } from "@/lib/ui-ar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Pencil, Trash2 } from "lucide-react"
import type { FormEvent } from "react"
import { useEffect, useState } from "react"

export function UsersPage({ token }: { token: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [addState, setAddState] = useState<"idle" | "loading" | "success">("idle")
  const [editOpenByUser, setEditOpenByUser] = useState<Record<string, boolean>>({})
  const [deleteOpenByUser, setDeleteOpenByUser] = useState<Record<string, boolean>>({})
  const [editStateByUser, setEditStateByUser] = useState<Record<string, "idle" | "loading">>({})
  const [deleteStateByUser, setDeleteStateByUser] = useState<Record<string, "idle" | "loading">>({})
  const [editDraftByUser, setEditDraftByUser] = useState<
    Record<string, { name: string; email: string; password: string }>
  >({})

  const loadUsers = () => {
    getUsers(token)
      .then(setUsers)
      .catch(() => setError(err.load))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    try {
      setAddState("loading")
      await createUser(token, { name, email, password })
      setName("")
      setEmail("")
      setPassword("")
      setSuccess("تم إنشاء المستخدم بنجاح.")
      setLoading(true)
      loadUsers()
      setAddState("success")
      setTimeout(() => {
        setAddOpen(false)
        setAddState("idle")
      }, 900)
    } catch {
      setAddState("idle")
      setError(err.create)
    }
  }

  const openEdit = (user: User) => {
    setEditDraftByUser((prev) => ({
      ...prev,
      [user.id]: { name: user.name, email: user.email, password: "" },
    }))
    setEditOpenByUser((prev) => ({ ...prev, [user.id]: true }))
  }

  const setEditDraftField = (userId: string, field: "name" | "email" | "password", value: string) => {
    setEditDraftByUser((prev) => ({
      ...prev,
      [userId]: {
        name: prev[userId]?.name ?? "",
        email: prev[userId]?.email ?? "",
        password: prev[userId]?.password ?? "",
        [field]: value,
      },
    }))
  }

  const onUpdateUser = async (event: FormEvent, user: User) => {
    event.preventDefault()
    const draft = editDraftByUser[user.id]
    if (!draft) return
    setError("")
    setSuccess("")
    try {
      setEditStateByUser((prev) => ({ ...prev, [user.id]: "loading" }))
      await updateUser(token, user.id, {
        name: draft.name,
        email: draft.email,
        ...(draft.password.trim() ? { password: draft.password.trim() } : {}),
      })
      setSuccess("تم تعديل المستخدم بنجاح.")
      setEditOpenByUser((prev) => ({ ...prev, [user.id]: false }))
      setLoading(true)
      loadUsers()
    } catch {
      setError(err.create)
    } finally {
      setEditStateByUser((prev) => ({ ...prev, [user.id]: "idle" }))
    }
  }

  const onDeleteUser = async (user: User) => {
    setError("")
    setSuccess("")
    try {
      setDeleteStateByUser((prev) => ({ ...prev, [user.id]: "loading" }))
      await deleteUser(token, user.id)
      setSuccess("تم حذف المستخدم بنجاح.")
      setDeleteOpenByUser((prev) => ({ ...prev, [user.id]: false }))
      setLoading(true)
      loadUsers()
    } catch {
      setError("تعذر حذف المستخدم.")
    } finally {
      setDeleteStateByUser((prev) => ({ ...prev, [user.id]: "idle" }))
    }
  }

  const filteredUsers = users.filter((user) => {
    const q = search.toLowerCase()
    return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">المستخدمون</h2>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}
      <input
        className="w-full max-w-md rounded border bg-transparent px-2 py-1"
        placeholder="بحث في المستخدمين…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <PopoverForm
        title="إضافة مستخدم"
        open={addOpen}
        setOpen={setAddOpen}
        width="520px"
        height="260px"
        showCloseButton={addState !== "success"}
        showSuccess={addState === "success"}
        openChild={
          <form className="flex h-full min-h-0 flex-col" onSubmit={onCreate}>
            <PopoverFormBody
              footer={
                <div className="flex justify-end">
                  <PopoverFormButton loading={addState === "loading"} text="إنشاء مستخدم" />
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <PopoverFormField label="الاسم" htmlFor="add-user-name">
                  <input
                    id="add-user-name"
                    className={popoverFormControlClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </PopoverFormField>
                <PopoverFormField label="البريد الإلكتروني" htmlFor="add-user-email">
                  <input
                    id="add-user-email"
                    className={popoverFormControlClass}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                </PopoverFormField>
                <PopoverFormField label="كلمة المرور" htmlFor="add-user-password">
                  <input
                    id="add-user-password"
                    className={popoverFormControlClass}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                  />
                </PopoverFormField>
              </div>
            </PopoverFormBody>
          </form>
        }
        successChild={
          <PopoverFormSuccess title="تم إنشاء المستخدم" description="تم تفعيل الحساب في النظام." />
        }
      />
      {loading ? <p className="text-sm text-muted-foreground">جاري تحميل المستخدمين…</p> : null}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>الاسم</TableHead>
              <TableHead>البريد</TableHead>
              <TableHead>الصلاحية</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead>تعديل</TableHead>
              <TableHead>حذف</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  لا مستخدمين مطابقين للبحث.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">
                    {u.email}
                  </TableCell>
                  <TableCell>{roleAr(u.role)}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {new Date(u.createdAt).toLocaleString(localeAr)}
                  </TableCell>
                  <TableCell>
                    <PopoverForm
                      title={`تعديل ${u.name}`}
                      open={editOpenByUser[u.id] ?? false}
                      setOpen={(value) => {
                        if (value) openEdit(u)
                        else setEditOpenByUser((prev) => ({ ...prev, [u.id]: false }))
                      }}
                      width="520px"
                      height="260px"
                      showCloseButton
                      showSuccess={false}
                      triggerClassName="h-8 w-8 justify-center p-0"
                      triggerChild={<Pencil className="size-4" />}
                      openChild={
                        <form className="flex h-full min-h-0 flex-col" onSubmit={(e) => void onUpdateUser(e, u)}>
                          <PopoverFormBody
                            footer={
                              <div className="flex justify-end">
                                <PopoverFormButton
                                  loading={editStateByUser[u.id] === "loading"}
                                  text="حفظ التعديلات"
                                />
                              </div>
                            }
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <PopoverFormField label="الاسم" htmlFor={`edit-user-name-${u.id}`}>
                                <input
                                  id={`edit-user-name-${u.id}`}
                                  className={popoverFormControlClass}
                                  value={editDraftByUser[u.id]?.name ?? u.name}
                                  onChange={(e) => setEditDraftField(u.id, "name", e.target.value)}
                                  required
                                />
                              </PopoverFormField>
                              <PopoverFormField label="البريد الإلكتروني" htmlFor={`edit-user-email-${u.id}`}>
                                <input
                                  id={`edit-user-email-${u.id}`}
                                  className={popoverFormControlClass}
                                  type="email"
                                  value={editDraftByUser[u.id]?.email ?? u.email}
                                  onChange={(e) => setEditDraftField(u.id, "email", e.target.value)}
                                  required
                                  dir="ltr"
                                />
                              </PopoverFormField>
                              <PopoverFormField
                                label="كلمة مرور جديدة (اختياري)"
                                htmlFor={`edit-user-password-${u.id}`}
                              >
                                <input
                                  id={`edit-user-password-${u.id}`}
                                  className={popoverFormControlClass}
                                  type="password"
                                  value={editDraftByUser[u.id]?.password ?? ""}
                                  onChange={(e) => setEditDraftField(u.id, "password", e.target.value)}
                                  dir="ltr"
                                />
                              </PopoverFormField>
                            </div>
                          </PopoverFormBody>
                        </form>
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {u.role === "admin" ? (
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-400"
                        disabled
                        title="لا يمكن حذف مستخدم مشرف"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : (
                      <PopoverForm
                        title={`حذف ${u.name}`}
                        open={deleteOpenByUser[u.id] ?? false}
                        setOpen={(value) =>
                          setDeleteOpenByUser((prev) => ({ ...prev, [u.id]: value }))
                        }
                        width="440px"
                        height="220px"
                        showCloseButton
                        showSuccess={false}
                        triggerClassName="h-8 w-8 justify-center p-0 text-rose-600 border-rose-200 hover:bg-rose-50"
                        triggerChild={<Trash2 className="size-4" />}
                        openChild={
                          <form className="flex h-full min-h-0 flex-col" onSubmit={(e) => {
                            e.preventDefault()
                            void onDeleteUser(u)
                          }}>
                            <PopoverFormBody
                              footer={
                                <div className="flex justify-end gap-2">
                                  <PopoverFormButton
                                    loading={deleteStateByUser[u.id] === "loading"}
                                    text="تأكيد الحذف"
                                  />
                                </div>
                              }
                            >
                              <p className="text-sm">
                                هل أنت متأكد من حذف المستخدم <span className="font-semibold">{u.name}</span>؟
                              </p>
                            </PopoverFormBody>
                          </form>
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
