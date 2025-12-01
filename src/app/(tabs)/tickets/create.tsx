import { View, ScrollView, Text, Alert, TouchableOpacity, Image, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ProgressBar, Card, Avatar, IconButton, TextInput, HelperText, Chip, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useRef } from 'react';
import { useCompanyStore } from '@/stores/companyStore';
import { useTicketStore } from '@/stores/ticketStore';
import { ControlledInput } from '@/components/ui/ControlledInput';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CompanyExploreItem } from '@/types/company';
import { useDebounceCallback } from '@/hooks/useDebounceCallback';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { CompanyCardSkeleton, SelectionCardSkeleton } from '@/components/Skeleton';

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

    // Animation for progress bar
    const progressAnim = useRef(new Animated.Value(0)).current;
    // Animation for button visibility
    const buttonOpacity = useRef(new Animated.Value(0)).current;

    const { control, handleSubmit, formState: { errors, isValid }, setValue, watch, trigger } = useForm<CreateTicketData>({
        resolver: zodResolver(createTicketSchema),
        mode: 'onChange',
    });

    const watchedAreaId = watch('areaId');
    const watchedCategoryId = watch('categoryId');
    const watchedPriority = watch('priority');
    const watchedTitle = watch('title');
    const watchedDescription = watch('description');

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

    // Smooth progress bar animation
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: submissionProgress,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [submissionProgress]);

    // Check step validity for button visibility
    const isStepValid = () => {
        if (step === 1) return !!selectedCompanyId;
        if (step === 2) {
            if (areasEnabled && subStep === 'area') return !!watchedAreaId;
            return !!watchedCategoryId;
        }
        if (step === 3) return !!watchedPriority;
        if (step === 4) {
            return (watchedTitle?.length >= 5) && (watchedDescription?.length >= 20);
        }
        return false;
    };

    const showButton = isStepValid();

    useEffect(() => {
        Animated.timing(buttonOpacity, {
            toValue: showButton ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [showButton]);

    const handleSelectCompany = (companyId: string) => {
        setSelectedCompanyId(companyId);
    };

    const handleNext = async () => {
        if (step === 1) {
            if (selectedCompanyId) setStep(2);
        } else if (step === 2) {
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

    // Update progress based on status text
    useEffect(() => {
        if (isSubmitting && submissionStatus === 'processing') {
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
    }, [creationStatus, submissionStatus, isSubmitting]);


    const renderStep1 = () => (
        <View className="flex-1 px-6 pt-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Selecciona una Empresa</Text>
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {companiesLoading ? (
                    <View className="py-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <CompanyCardSkeleton key={i} />
                        ))}
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
                            className={`p-4 mb-3 rounded-2xl border-2 flex-row items-center bg-white shadow-sm ${selectedCompanyId === company.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}
                        >
                            {company.logoUrl ? (
                                <Avatar.Image size={48} source={{ uri: company.logoUrl }} />
                            ) : (
                                <Avatar.Text size={48} label={company.name.substring(0, 2)} />
                            )}
                            <View className="ml-4 flex-1">
                                <Text className={`font-bold text-lg ${selectedCompanyId === company.id ? 'text-blue-900' : 'text-gray-900'}`}>{company.name}</Text>
                                <Text className="text-gray-500 text-sm">{typeof company.industry === 'object' ? company.industry?.name : company.industry}</Text>
                            </View>
                            {selectedCompanyId === company.id ? (
                                <MaterialCommunityIcons name="check-circle" size={24} color="#2563eb" />
                            ) : (
                                <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                            )}
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
            <View className="flex-1 px-6 pt-6">
                <View className="mb-4">
                    <Text className="text-xl font-bold text-gray-900 mb-2">Clasificación del Ticket</Text>
                    <Text className="text-gray-500">
                        {showArea ? 'Selecciona el área o departamento correspondiente.' : 'Selecciona la categoría que mejor describa tu problema.'}
                    </Text>
                </View>

                {!loadingAreas && (
                    <View className="mb-3 border-b border-gray-100 pb-2">
                        <Text className="text-lg font-semibold text-gray-800">
                            {showArea ? 'Área / Departamento' : 'Categoría'}
                        </Text>
                    </View>
                )}

                {loadingAreas ? (
                    <View className="mt-4">
                        {[1, 2, 3, 4].map((i) => (
                            <SelectionCardSkeleton key={i} />
                        ))}
                    </View>
                ) : (
                    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
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
                    </ScrollView>
                )}
            </View>
        );
    };

    const renderStep3 = () => (
        <View className="flex-1 px-6 pt-6">
            <View className="mb-4">
                <Text className="text-xl font-bold text-gray-900 mb-2">Prioridad del Ticket</Text>
                <Text className="text-gray-500">Indica la urgencia de tu solicitud.</Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <Controller
                    control={control}
                    name="priority"
                    render={({ field: { onChange, value } }) => (
                        <View>
                            {[
                                {
                                    id: 'low',
                                    label: 'Baja - Normal',
                                    desc: 'Problemas menores que no afectan el funcionamiento principal.',
                                    icon: 'flash-outline',
                                    // Green
                                    styles: {
                                        bg: 'bg-green-50', bgSel: 'bg-green-100',
                                        border: 'border-green-200', borderSel: 'border-green-500',
                                        text: 'text-green-900', textSel: 'text-green-950',
                                        icon: '#22c55e', iconSel: '#16a34a' // green-500 -> green-600
                                    }
                                },
                                {
                                    id: 'medium',
                                    label: 'Media - Importante',
                                    desc: 'Problemas que afectan parcialmente el funcionamiento o requieren atención.',
                                    icon: 'clock-outline',
                                    // Yellow
                                    styles: {
                                        bg: 'bg-yellow-50', bgSel: 'bg-yellow-100',
                                        border: 'border-yellow-200', borderSel: 'border-yellow-500',
                                        text: 'text-yellow-900', textSel: 'text-yellow-950',
                                        icon: '#eab308', iconSel: '#ca8a04' // yellow-500 -> yellow-600
                                    }
                                },
                                {
                                    id: 'high',
                                    label: 'Alta - Crítico',
                                    desc: 'Problemas críticos que impiden el funcionamiento total o urgente.',
                                    icon: 'alert-circle-outline',
                                    // Red
                                    styles: {
                                        bg: 'bg-red-50', bgSel: 'bg-red-100',
                                        border: 'border-red-200', borderSel: 'border-red-500',
                                        text: 'text-red-900', textSel: 'text-red-950',
                                        icon: '#ef4444', iconSel: '#dc2626' // red-500 -> red-600
                                    }
                                }
                            ].map((item) => {
                                const isSelected = value === item.id;
                                const s = item.styles;

                                const bgClass = isSelected ? s.bgSel : s.bg;
                                const borderClass = isSelected ? `${s.borderSel} border-4` : `${s.border} border-2`;
                                const textClass = isSelected ? s.textSel : s.text;
                                const iconColor = isSelected ? s.iconSel : s.icon;

                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => onChange(item.id)}
                                        activeOpacity={0.7}
                                        className={`p-5 mb-4 rounded-2xl transition-all ${bgClass} ${borderClass}`}
                                    >
                                        <View className="flex-row items-center mb-2">
                                            <View className={`p-2 rounded-full mr-3 bg-white/60`}>
                                                <MaterialCommunityIcons name={item.icon as any} size={24} color={iconColor} />
                                            </View>
                                            <Text className={`font-bold text-lg ${textClass}`}>
                                                {item.label}
                                            </Text>

                                        </View>
                                        <Text className={`text-sm ${textClass} opacity-90 font-medium`}>
                                            {item.desc}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                />
            </ScrollView>
        </View>
    );

    const renderStep4 = () => (
        <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
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
        </ScrollView>
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
                            <Animated.View
                                className="h-full bg-blue-600 rounded-full"
                                style={{
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ['0%', '100%']
                                    })
                                }}
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

            <View className="p-4 border-b border-gray-100 flex-row items-center justify-between bg-white z-10">
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

            <View className="flex-1">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </View>

            {!isSubmitting && showButton && (
                <Animated.View
                    style={{ opacity: buttonOpacity }}
                    className="absolute bottom-6 left-6 right-6 z-20"
                >
                    <Button
                        mode="contained"
                        onPress={step === 4 ? handleSubmit(onSubmit) : handleNext}
                        loading={isLoading}
                        disabled={isLoading}
                        className="rounded-full shadow-lg"
                        contentStyle={{ height: 50 }}
                        labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                    >
                        {step === 4 ? 'Enviar Ticket' : 'Continuar'}
                    </Button>
                </Animated.View>
            )}
        </ScreenContainer>
    );
}
