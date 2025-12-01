import { View, ScrollView, Text, Alert, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ProgressBar, Card, Avatar, IconButton, TextInput, HelperText, Chip, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useCompanyStore } from '@/stores/companyStore';
import { useTicketStore } from '@/stores/ticketStore';
import { ControlledInput } from '@/components/ui/ControlledInput';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CompanyExploreItem } from '@/types/company';
import { useDebounceCallback } from '@/hooks/useDebounceCallback';
import { ScreenContainer } from '@/components/layout/ScreenContainer';

const createTicketSchema = z.object({
    title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
    description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
    categoryId: z.string().min(1, 'Debes seleccionar una categoría'),
    areaId: z.string().optional().nullable(),
    priority: z.enum(['low', 'medium', 'high']),
});

type CreateTicketData = z.infer<typeof createTicketSchema>;

export default function CreateTicketScreen() {
    const router = useRouter();
    const { companies, fetchCompanies, companiesLoading, setFilter, clearFilters } = useCompanyStore();
    const { createTicket, isLoading, categories, fetchCategories, creationStatus, checkCompanyAreasEnabled, fetchAreas } = useTicketStore();

    // Steps: 1=Company, 2=Classification (Area/Category), 3=Priority, 4=Details
    const [step, setStep] = useState(1);
    const [subStep, setSubStep] = useState<'area' | 'category'>('category'); // For Step 2

    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<ImagePicker.ImagePickerAsset[]>([]);

    // Area logic
    const [areasEnabled, setAreasEnabled] = useState(false);
    const [areas, setAreas] = useState<any[]>([]);
    const [loadingAreas, setLoadingAreas] = useState(false);

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionProgress, setSubmissionProgress] = useState(0);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    const { control, handleSubmit, formState: { errors, isValid }, setValue, watch, trigger } = useForm<CreateTicketData>({
        resolver: zodResolver(createTicketSchema),
        defaultValues: {
            priority: 'medium',
        },
        mode: 'onChange',
    });

    useEffect(() => {
        setFilter('followedByMe', true);
        fetchCompanies();
        return () => clearFilters();
    }, []);

    useEffect(() => {
        const loadCompanyData = async () => {
            if (selectedCompanyId) {
                fetchCategories(selectedCompanyId);
                setLoadingAreas(true);
                const enabled = await checkCompanyAreasEnabled(selectedCompanyId);
                setAreasEnabled(enabled);
                if (enabled) {
                    const companyAreas = await fetchAreas(selectedCompanyId);
                    setAreas(companyAreas);
                    setSubStep('area'); // Start with Area if enabled
                } else {
                    setAreas([]);
                    setValue('areaId', null);
                    setSubStep('category');
                }
                setLoadingAreas(false);
            }
        };
        loadCompanyData();
    }, [selectedCompanyId]);

    const handleSelectCompany = useDebounceCallback((companyId: string) => {
        setSelectedCompanyId(companyId);
        setStep(2);
    }, 200);

    const handleNext = async () => {
        if (step === 2) {
            if (areasEnabled && subStep === 'area') {
                const valid = await trigger('areaId');
                if (valid) setSubStep('category');
            } else {
                const valid = await trigger(['categoryId', 'areaId']);
                if (valid) setStep(3);
            }
        } else if (step === 3) {
            const valid = await trigger('priority');
            if (valid) setStep(4);
        }
    };

    const handleBack = () => {
        if (step === 2 && areasEnabled && subStep === 'category') {
            setSubStep('area');
            return;
        }

        if (step > 1) setStep(step - 1);
        else router.back();
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            setAttachments([...attachments, ...result.assets]);
        }
    };

    const removeAttachment = (index: number) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const onSubmit = async (data: CreateTicketData) => {
        if (!selectedCompanyId) return;

        setIsSubmitting(true);
        setSubmissionStatus('processing');
        setSubmissionProgress(0);

        try {
            await createTicket({
                title: data.title,
                description: data.description,
                category_id: data.categoryId,
                area_id: data.areaId || undefined,
                priority: data.priority,
                company_id: selectedCompanyId
            }, attachments);

            setSubmissionProgress(100);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s at 100%

            setSubmissionStatus('success');
            setTimeout(() => {
                router.replace('/(tabs)/tickets');
            }, 1500);
        } catch (error) {
            console.error(error);
            setSubmissionStatus('error');
            setTimeout(() => {
                setIsSubmitting(false);
                setSubmissionStatus('idle');
            }, 2000);
        }
    };

    const renderStep1 = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-4">Selecciona una Empresa</Text>
            <ScrollView className="max-h-[75vh]" showsVerticalScrollIndicator={false}>
                {companiesLoading ? (
                    <View className="items-center py-8">
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text className="text-gray-500 text-center mt-4">Cargando empresas...</Text>
                    </View>
                ) : companies.length === 0 ? (
                    <View className="items-center py-8">
                        <Text className="text-gray-500 text-center">No sigues a ninguna empresa aún.</Text>
                        <Button mode="text" onPress={() => router.push('/(tabs)/companies')}>Explorar Empresas</Button>
                    </View>
                ) : (
                    companies.map((company: CompanyExploreItem) => (
                        <TouchableOpacity
                            key={company.id}
                            onPress={() => handleSelectCompany(company.id)}
                            className={`p-4 mb-3 rounded-2xl border-2 flex-row items-center bg-white border-gray-100 shadow-sm active:border-blue-500 active:bg-blue-50`}
                        >
                            {company.logoUrl ? (
                                <Avatar.Image size={48} source={{ uri: company.logoUrl }} />
                            ) : (
                                <Avatar.Text size={48} label={company.name.substring(0, 2)} />
                            )}
                            <View className="ml-4 flex-1">
                                <Text className="font-bold text-gray-900 text-lg">{company.name}</Text>
                                <Text className="text-gray-500 text-sm">{typeof company.industry === 'object' ? company.industry?.name : company.industry}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );

    const renderStep2 = () => {
        // Classification Step (Area -> Category)
        const showArea = areasEnabled && subStep === 'area';
        const showCategory = !areasEnabled || subStep === 'category';

        return (
            <View>
                <Text className="text-xl font-bold text-gray-900 mb-2">Clasificación del Ticket</Text>
                <Text className="text-gray-500 mb-6">
                    {showArea ? 'Selecciona el área o departamento correspondiente.' : 'Selecciona la categoría que mejor describa tu problema.'}
                </Text>

                {loadingAreas ? (
                    <ActivityIndicator size="large" color="#2563eb" className="mt-8" />
                ) : (
                    <>
                        {showArea && (
                            <Controller
                                control={control}
                                name="areaId"
                                render={({ field: { onChange, value } }) => (
                                    <View className="mb-6">
                                        {areas.map((area: any) => (
                                            <TouchableOpacity
                                                key={area.id}
                                                onPress={() => onChange(area.id)}
                                                className={`p-4 mb-3 rounded-xl border-2 ${value === area.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                                            >
                                                <View className="flex-row justify-between items-center mb-1">
                                                    <Text className={`font-bold text-base ${value === area.id ? 'text-blue-900' : 'text-gray-900'}`}>{area.name}</Text>
                                                    {value === area.id && <MaterialCommunityIcons name="check-circle" size={20} color="#2563eb" />}
                                                </View>
                                                {area.description && (
                                                    <Text className="text-gray-500 text-sm leading-snug">{area.description}</Text>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            />
                        )}

                        {showCategory && (
                            <Controller
                                control={control}
                                name="categoryId"
                                render={({ field: { onChange, value } }) => (
                                    <View className="mb-6">
                                        {categories.map((cat: any) => (
                                            <TouchableOpacity
                                                key={cat.id}
                                                onPress={() => onChange(cat.id)}
                                                className={`p-4 mb-3 rounded-xl border-2 ${value === cat.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                                            >
                                                <View className="flex-row justify-between items-center mb-1">
                                                    <Text className={`font-bold text-base ${value === cat.id ? 'text-blue-900' : 'text-gray-900'}`}>{cat.name}</Text>
                                                    {value === cat.id && <MaterialCommunityIcons name="check-circle" size={20} color="#2563eb" />}
                                                </View>
                                                {cat.description && (
                                                    <Text className="text-gray-500 text-sm leading-snug">{cat.description}</Text>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            />
                        )}
                    </>
                )}
            </View>
        );
    };

    const renderStep3 = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-2">Prioridad del Ticket</Text>
            <Text className="text-gray-500 mb-6">Indica la urgencia de tu solicitud.</Text>

            <Controller
                control={control}
                name="priority"
                render={({ field: { onChange, value } }) => (
                    <View>
                        {[
                            {
                                value: 'low',
                                label: 'Baja',
                                description: 'Problemas menores que no afectan el funcionamiento principal.',
                                color: 'bg-green-50',
                                border: 'border-green-200',
                                activeBorder: 'border-green-500',
                                icon: 'arrow-down',
                                text: 'text-green-800',
                                iconColor: '#166534'
                            },
                            {
                                value: 'medium',
                                label: 'Media',
                                description: 'Problemas que afectan parcialmente el funcionamiento o requieren atención.',
                                color: 'bg-yellow-50',
                                border: 'border-yellow-200',
                                activeBorder: 'border-yellow-500',
                                icon: 'minus',
                                text: 'text-yellow-800',
                                iconColor: '#854d0e'
                            },
                            {
                                value: 'high',
                                label: 'Alta',
                                description: 'Problemas críticos que impiden el funcionamiento total o urgente.',
                                color: 'bg-red-50',
                                border: 'border-red-200',
                                activeBorder: 'border-red-500',
                                icon: 'arrow-up',
                                text: 'text-red-800',
                                iconColor: '#991b1b'
                            }
                        ].map((p) => (
                            <TouchableOpacity
                                key={p.value}
                                onPress={() => onChange(p.value)}
                                className={`p-4 mb-4 rounded-xl border-2 ${value === p.value ? p.activeBorder + ' ' + p.color : 'border-gray-200 bg-white'}`}
                            >
                                <View className="flex-row items-center mb-2">
                                    <View className={`p-2 rounded-full mr-3 ${value === p.value ? 'bg-white/50' : 'bg-gray-100'}`}>
                                        <MaterialCommunityIcons name={p.icon as any} size={24} color={p.iconColor} />
                                    </View>
                                    <Text className={`font-bold text-lg ${value === p.value ? p.text : 'text-gray-900'}`}>
                                        {p.label}
                                    </Text>
                                    {value === p.value && (
                                        <MaterialCommunityIcons name="check-circle" size={24} color={p.iconColor} className="ml-auto" />
                                    )}
                                </View>
                                <Text className={`text-sm ${value === p.value ? p.text : 'text-gray-500'}`}>
                                    {p.description}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            />
        </View>
    );

    const renderStep4 = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-2">Detalles del Problema</Text>
            <Text className="text-gray-500 mb-6">Describe tu problema y adjunta evidencia si es necesario.</Text>

            <ControlledInput
                control={control}
                name="title"
                label="Asunto"
                placeholder="Ej: Error al iniciar sesión"
                className="mb-4"
            />

            <ControlledInput
                control={control}
                name="description"
                label="Descripción Detallada"
                placeholder="Explica qué estabas haciendo, qué esperabas que pasara y qué pasó realmente..."
                multiline
                numberOfLines={6}
                className="mb-6"
            />

            <Text className="text-gray-800 font-bold mb-3 text-base">Adjuntos (Opcional)</Text>
            <View className="flex-row flex-wrap gap-3 mb-8">
                {attachments.map((file, index) => (
                    <View key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        <Image source={{ uri: file.uri }} className="w-full h-full" resizeMode="cover" />
                        <TouchableOpacity
                            onPress={() => removeAttachment(index)}
                            className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                        >
                            <MaterialCommunityIcons name="close" size={14} color="white" />
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity
                    onPress={pickImage}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50 active:bg-gray-100"
                >
                    <MaterialCommunityIcons name="camera-plus" size={28} color="#9ca3af" />
                    <Text className="text-xs text-gray-400 mt-1 font-medium">Añadir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const SubmissionOverlay = () => {
        if (!isSubmitting) return null;

        useEffect(() => {
            if (submissionStatus === 'processing') {
                if (creationStatus.includes('Creando ticket')) setSubmissionProgress(30);
                else if (creationStatus.includes('Subiendo')) {
                    const match = creationStatus.match(/(\d+) de (\d+)/);
                    if (match) {
                        const [_, current, total] = match;
                        const pct = 30 + (parseInt(current) / parseInt(total)) * 60;
                        setSubmissionProgress(pct);
                    } else {
                        setSubmissionProgress(50);
                    }
                }
            }
        }, [creationStatus, submissionStatus]);

        return (
            <View className="absolute inset-0 bg-white/95 z-50 items-center justify-center px-8">
                {submissionStatus === 'success' ? (
                    <View className="items-center">
                        <View className="bg-green-100 p-6 rounded-full mb-6">
                            <MaterialCommunityIcons name="check" size={48} color="#166534" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">¡Ticket Creado!</Text>
                        <Text className="text-gray-500 text-center">Tu solicitud ha sido registrada correctamente.</Text>
                    </View>
                ) : submissionStatus === 'error' ? (
                    <View className="items-center">
                        <View className="bg-red-100 p-6 rounded-full mb-6">
                            <MaterialCommunityIcons name="alert" size={48} color="#991b1b" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">Algo salió mal</Text>
                        <Text className="text-gray-500 text-center">No pudimos crear tu ticket. Por favor intenta de nuevo.</Text>
                    </View>
                ) : (
                    <View className="items-center w-full">
                        <ActivityIndicator size="large" color="#2563eb" className="mb-8" />
                        <Text className="text-xl font-bold text-gray-900 mb-2">
                            {creationStatus || 'Procesando...'}
                        </Text>
                        <Text className="text-gray-500 text-center mb-6">
                            Por favor no cierres la aplicación
                        </Text>
                        <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <View
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${submissionProgress}%` }}
                            />
                        </View>
                        <Text className="text-xs text-gray-400 mt-2">{Math.round(submissionProgress)}%</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <ScreenContainer backgroundColor="white">
            <SubmissionOverlay />

            <View className="p-4 border-b border-gray-100 flex-row items-center justify-between bg-white">
                <TouchableOpacity onPress={handleBack} className="p-2 -ml-2 rounded-full active:bg-gray-100">
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View className="flex-row gap-1">
                    {[1, 2, 3, 4].map(i => {
                        let isActive = step >= i;
                        let isHalf = false;

                        if (i === 2 && step === 2 && areasEnabled && subStep === 'area') {
                            isActive = false;
                            isHalf = true;
                        }

                        return (
                            <View
                                key={i}
                                className={`h-1.5 w-8 rounded-full overflow-hidden ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                {isHalf && (
                                    <View className="h-full w-1/2 bg-blue-600" />
                                )}
                            </View>
                        );
                    })}
                </View>
                <View className="w-8" />
            </View>

            <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                <View className="h-20" />
            </ScrollView>

            {!isSubmitting && (
                <View className="p-4 border-t border-gray-100 bg-white shadow-lg">
                    <Button
                        mode="contained"
                        onPress={step === 4 ? handleSubmit(onSubmit) : handleNext}
                        loading={isLoading}
                        disabled={isLoading}
                        className="rounded-xl py-1"
                        labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                    >
                        {step === 4 ? 'Enviar Ticket' : 'Continuar'}
                    </Button>
                </View>
            )}
        </ScreenContainer>
    );
}
